import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        stripeAccountId: true,
        stripeAccountStatus: true,
        stripeOnboardingComplete: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If no Stripe account, return disconnected status
    if (!user.stripeAccountId) {
      return NextResponse.json({
        success: true,
        connected: false,
        status: "DISCONNECTED",
        onboardingComplete: false,
        chargesEnabled: false,
        payoutsEnabled: false,
      });
    }

    // Get current account status from Stripe
    let chargesEnabled = false;
    let payoutsEnabled = false;
    let accountStatus = user.stripeAccountStatus;

    if (stripe) {
      try {
        const account = await stripe.accounts.retrieve(user.stripeAccountId);
        chargesEnabled = account.charges_enabled || false;
        payoutsEnabled = account.payouts_enabled || false;

        // Update status based on current Stripe account state
        // For OAuth Standard Connect, if account is fully operational, mark as CONNECTED
        if (chargesEnabled && payoutsEnabled && account.details_submitted) {
          accountStatus = "CONNECTED";
        } else if (chargesEnabled && payoutsEnabled) {
          // Account can accept payments but details might be pending
          accountStatus = "CONNECTED";
        } else if (account.details_submitted) {
          accountStatus = "PENDING";
        } else {
          accountStatus = "PENDING";
        }
      } catch (error) {
        console.error("Error fetching Stripe account:", error);
        // If we can't fetch the account, it might be deleted
        accountStatus = "DISCONNECTED";
      }
    }

    // Update user status in database if it changed
    if (accountStatus !== user.stripeAccountStatus) {
      await db.user.update({
        where: { id: session.user.id },
        data: {
          stripeAccountStatus: accountStatus,
        },
      });
    }

    // User is connected if they have a stripeAccountId (even if status is PENDING)
    // This allows the UI to show "connected" state even during onboarding
    return NextResponse.json({
      success: true,
      connected: !!user.stripeAccountId, // Connected if account ID exists
      accountId: user.stripeAccountId,
      status: accountStatus,
      onboardingComplete: user.stripeOnboardingComplete,
      chargesEnabled,
      payoutsEnabled,
    });
  } catch (error) {
    console.error("Stripe status error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch Stripe status",
      },
      { status: 500 }
    );
  }
}
