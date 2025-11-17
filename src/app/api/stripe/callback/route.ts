import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("account_id");

    if (!accountId) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings?error=missing_account_id`
      );
    }

    if (!stripe) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings?error=stripe_not_configured`
      );
    }

    // Get the Stripe account details
    const account = await stripe.accounts.retrieve(accountId);

    // Find user by Stripe account ID
    const user = await db.user.findFirst({
      where: { stripeAccountId: accountId },
    });

    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings?error=user_not_found`
      );
    }

    // Update user's Stripe status based on account details
    const chargesEnabled = account.charges_enabled;
    const payoutsEnabled = account.payouts_enabled;
    const detailsSubmitted = account.details_submitted;

    let status = "PENDING";
    let onboardingComplete = false;

    if (chargesEnabled && payoutsEnabled && detailsSubmitted) {
      status = "CONNECTED";
      onboardingComplete = true;
    } else if (detailsSubmitted) {
      status = "PENDING";
      onboardingComplete = true;
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        stripeAccountStatus: status,
        stripeOnboardingComplete: onboardingComplete,
      },
    });

    // Redirect back to settings with success message
    const redirectUrl = new URL(
      `${process.env.NEXTAUTH_URL}/settings`
    );

    if (status === "CONNECTED") {
      redirectUrl.searchParams.set("success", "stripe_connected");
    } else if (onboardingComplete) {
      redirectUrl.searchParams.set("info", "stripe_pending");
    } else {
      redirectUrl.searchParams.set("error", "stripe_incomplete");
    }

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("Stripe callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings?error=callback_failed`
    );
  }
}
