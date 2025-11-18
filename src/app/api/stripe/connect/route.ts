import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Stripe Connect Standard OAuth - Initiation Endpoint
 *
 * This endpoint generates the OAuth authorization URL for connecting an existing Stripe account.
 * Works for users with Stripe accounts in ANY country.
 *
 * Flow:
 * 1. User clicks "Connect Stripe" button → calls this endpoint
 * 2. This endpoint generates OAuth URL with user ID in state parameter
 * 3. Returns URL for frontend to redirect user to Stripe
 * 4. User authorizes on Stripe → redirects to /api/stripe/callback
 * 5. Callback exchanges code for account ID and saves to database
 */
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

    // Allow reconnecting if onboarding wasn't completed
    // This handles the case where user started OAuth but didn't finish onboarding
    if (user.stripeAccountId && user.stripeOnboardingComplete) {
      return NextResponse.json(
        {
          success: false,
          error: "Stripe account already connected",
          message:
            "You already have a Stripe account connected. Disconnect it first to connect a different account.",
        },
        { status: 400 }
      );
    }
    // If account exists but onboarding incomplete, allow reconnecting
    // The callback will update the account ID if needed

    // Validate Stripe Connect Client ID is configured
    const connectClientId = process.env.STRIPE_CONNECT_CLIENT_ID;
    if (!connectClientId) {
      return NextResponse.json(
        {
          success: false,
          error: "Stripe Connect not configured",
          message:
            "STRIPE_CONNECT_CLIENT_ID environment variable is missing. Please configure it in your Stripe dashboard under Settings > Connect > OAuth settings.",
        },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const redirectUri = `${baseUrl}/api/stripe/callback`;

    // Use user ID as state parameter for security (validates callback belongs to this user)
    // Include email in state for additional verification if needed
    const state = Buffer.from(
      JSON.stringify({
        userId: session.user.id,
        email: user.email,
        timestamp: Date.now(),
      })
    ).toString("base64");

    // Build Stripe OAuth authorization URL
    // Scope: read_write allows us to create charges and manage the connected account
    const params = new URLSearchParams({
      client_id: connectClientId,
      response_type: "code",
      scope: "read_write",
      redirect_uri: redirectUri,
      state: state,
      // Optional: pre-fill user email if available
      ...(user.email && { "stripe_user[email]": user.email }),
    });

    const oauthUrl = `https://connect.stripe.com/oauth/authorize?${params.toString()}`;

    return NextResponse.json({
      success: true,
      url: oauthUrl,
    });
  } catch (error: unknown) {
    console.error("Stripe Connect OAuth initiation error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: "Failed to initiate Stripe connection",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
