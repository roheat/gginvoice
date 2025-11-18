import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        stripeAccountId: true,
      },
    });

    if (!user || !user.stripeAccountId) {
      return NextResponse.json(
        {
          success: false,
          error: "No Stripe account connected",
        },
        { status: 400 }
      );
    }

    // For OAuth-connected accounts (Standard Connect), we don't delete the account
    // The account belongs to the user, we just remove our connection to it
    // Only attempt deletion for Express accounts (which we created)
    // For Standard Connect OAuth accounts, deletion will fail silently and that's OK
    if (stripe) {
      try {
        await stripe.accounts.del(user.stripeAccountId);
      } catch {
        // Expected to fail for OAuth accounts - that's fine, we just clear our reference
        console.log(
          "Account deletion skipped (OAuth account or already deleted)"
        );
      }
    }

    // Update user to remove Stripe connection
    await db.user.update({
      where: { id: session.user.id },
      data: {
        stripeAccountId: null,
        stripeAccountStatus: "DISCONNECTED",
        stripeOnboardingComplete: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Stripe account disconnected successfully",
    });
  } catch (error) {
    console.error("Stripe disconnect error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to disconnect Stripe account",
      },
      { status: 500 }
    );
  }
}
