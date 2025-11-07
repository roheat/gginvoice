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
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user already has a Stripe account
    if (user.stripeAccountId) {
      return NextResponse.json(
        {
          success: false,
          error: "Stripe account already connected",
        },
        { status: 400 }
      );
    }

    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    // Create Stripe Connect Express account for US
    const account = await stripe.accounts.create({
      type: "express",
      country: "US", // US since your Stripe account is now in US
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual", // US supports 'individual'
      settings: {
        payouts: {
          schedule: {
            interval: "daily",
          },
        },
      },
    });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXTAUTH_URL}/settings?refresh=true`,
      return_url: `${process.env.NEXTAUTH_URL}/api/stripe/callback?account_id=${account.id}`,
      type: "account_onboarding",
    });

    // Update user with Stripe account ID
    await db.user.update({
      where: { id: session.user.id },
      data: {
        stripeAccountId: account.id,
        stripeAccountStatus: "PENDING",
        stripeOnboardingComplete: false,
      },
    });

    return NextResponse.json({
      success: true,
      url: accountLink.url,
      accountId: account.id,
    });
  } catch (error: any) {
    console.error("Stripe Connect error:", error);

    // Check if it's a Connect not enabled error
    if (
      error?.type === "StripeInvalidRequestError" &&
      (error?.raw?.message?.includes("signed up for Connect") ||
        error?.raw?.message?.includes("review the responsibilities") ||
        error?.raw?.message?.includes("platform-profile"))
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Stripe Connect platform profile required",
          message:
            "Please complete your Stripe Connect platform profile at https://dashboard.stripe.com/settings/connect/platform-profile",
          action: "enable_connect",
        },
        { status: 400 }
      );
    }

    // Check if it's a geographic restriction error
    if (
      error?.type === "StripeInvalidRequestError" &&
      error?.raw?.message?.includes("cannot be created by platforms in")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Geographic restriction",
          message:
            "Your Stripe account location doesn't support creating accounts in the specified country. Please contact Stripe support.",
          action: "contact_support",
        },
        { status: 400 }
      );
    }

    // Check if it's a business type error
    if (
      error?.type === "StripeInvalidRequestError" &&
      error?.raw?.message?.includes("not a supported business type")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Business type not supported",
          message:
            "The business type is not supported in your country. Please contact Stripe support for assistance.",
          action: "contact_support",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create Stripe account",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
