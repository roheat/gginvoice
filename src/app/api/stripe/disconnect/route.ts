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

    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    // Delete the Stripe Connect account
    try {
      await stripe.accounts.del(user.stripeAccountId);
    } catch (error) {
      console.error("Error deleting Stripe account:", error);
      // Continue even if Stripe deletion fails
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
