import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

/**
 * Stripe Connect Standard OAuth - Callback Handler
 *
 * This endpoint handles the OAuth callback from Stripe after user authorization.
 * It exchanges the authorization code for a connected account ID and saves it.
 *
 * Flow:
 * 1. Stripe redirects here with ?code=xxx&state=base64EncodedState
 * 2. Validate state parameter (contains user ID)
 * 3. Exchange authorization code for account access token via Stripe OAuth API
 * 4. Extract connected account ID from response
 * 5. Retrieve account details to verify connection status
 * 6. Save account ID and status to user record
 * 7. Redirect back to settings page with success/error status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const redirectUrl = new URL(`${baseUrl}/settings`);

    // Handle OAuth errors from Stripe (user denied access, etc.)
    if (error) {
      console.error("Stripe OAuth error:", error, errorDescription);
      redirectUrl.searchParams.set("error", `stripe_oauth_denied:${error}`);
      if (errorDescription) {
        redirectUrl.searchParams.set("error_description", errorDescription);
      }
      return NextResponse.redirect(redirectUrl.toString());
    }

    // Validate required parameters
    if (!code) {
      console.error("Missing authorization code in callback");
      redirectUrl.searchParams.set("error", "missing_authorization_code");
      return NextResponse.redirect(redirectUrl.toString());
    }

    if (!state) {
      console.error("Missing state parameter in callback");
      redirectUrl.searchParams.set("error", "missing_state_parameter");
      return NextResponse.redirect(redirectUrl.toString());
    }

    if (!stripe) {
      console.error("Stripe not configured");
      redirectUrl.searchParams.set("error", "stripe_not_configured");
      return NextResponse.redirect(redirectUrl.toString());
    }

    // Decode and validate state parameter
    let stateData: {
      userId: string;
      email: string;
      timestamp: number;
    };

    try {
      const decodedState = Buffer.from(state, "base64").toString("utf-8");
      stateData = JSON.parse(decodedState);

      // Validate state is not too old (prevent replay attacks)
      const maxAge = 10 * 60 * 1000; // 10 minutes
      if (Date.now() - stateData.timestamp > maxAge) {
        throw new Error("State parameter expired");
      }
    } catch (stateError) {
      console.error("Invalid state parameter:", stateError);
      redirectUrl.searchParams.set("error", "invalid_state_parameter");
      return NextResponse.redirect(redirectUrl.toString());
    }

    // Validate user exists and matches state
    const user = await db.user.findUnique({
      where: { id: stateData.userId },
    });

    if (!user) {
      console.error("User not found for state:", stateData.userId);
      redirectUrl.searchParams.set("error", "user_not_found");
      return NextResponse.redirect(redirectUrl.toString());
    }

    // Verify email matches (additional security check)
    if (user.email !== stateData.email) {
      console.error("Email mismatch in state validation");
      redirectUrl.searchParams.set("error", "state_validation_failed");
      return NextResponse.redirect(redirectUrl.toString());
    }

    // Allow updating connection if onboarding wasn't completed
    // This allows users to restart the connection if they didn't finish onboarding
    if (user.stripeAccountId && user.stripeOnboardingComplete) {
      redirectUrl.searchParams.set("error", "stripe_account_already_connected");
      return NextResponse.redirect(redirectUrl.toString());
    }
    // If account exists but onboarding incomplete, proceed to update it

    try {
      // Exchange authorization code for account access token
      // This is the critical step that gives us the connected account ID
      const oauthResponse = await stripe.oauth.token({
        grant_type: "authorization_code",
        code: code,
      });

      const connectedAccountId = oauthResponse.stripe_user_id;

      if (!connectedAccountId) {
        throw new Error("No account ID returned from Stripe OAuth");
      }

      // Retrieve account details to verify connection and get status
      const account = await stripe.accounts.retrieve(connectedAccountId);

      // Determine account status based on Stripe account capabilities
      const chargesEnabled = account.charges_enabled || false;
      const payoutsEnabled = account.payouts_enabled || false;
      const detailsSubmitted = account.details_submitted || false;

      let status = "PENDING";
      let onboardingComplete = false;

      // Mark as CONNECTED if account can accept payments (charges enabled)
      // For OAuth Standard Connect, existing accounts should be immediately CONNECTED
      if (chargesEnabled && payoutsEnabled) {
        status = "CONNECTED";
        onboardingComplete = true;
      }
      // Account has submitted details but not yet verified (can accept payments soon)
      else if (chargesEnabled) {
        // Charges enabled but payouts not yet - still can accept payments
        status = "CONNECTED";
        onboardingComplete = false; // Not fully complete until payouts enabled
      }
      // Account has submitted details but verification pending
      else if (detailsSubmitted) {
        status = "PENDING";
        onboardingComplete = false;
      }
      // Account connected but onboarding not completed (user didn't finish setup)
      else {
        status = "PENDING";
        onboardingComplete = false;
      }

      // Save connected account ID and status to user record
      await db.user.update({
        where: { id: user.id },
        data: {
          stripeAccountId: connectedAccountId,
          stripeAccountStatus: status,
          stripeOnboardingComplete: onboardingComplete,
        },
      });

      // Redirect with appropriate success/info message
      if (status === "CONNECTED") {
        redirectUrl.searchParams.set("success", "stripe_connected");
      } else if (onboardingComplete) {
        redirectUrl.searchParams.set("info", "stripe_pending_verification");
      } else {
        redirectUrl.searchParams.set("info", "stripe_connected_pending");
      }

      return NextResponse.redirect(redirectUrl.toString());
    } catch (stripeError: unknown) {
      console.error("Stripe OAuth token exchange error:", stripeError);

      const errorMessage =
        stripeError instanceof Error
          ? stripeError.message
          : "Failed to exchange authorization code";

      // Handle specific Stripe API errors
      if (
        stripeError &&
        typeof stripeError === "object" &&
        "type" in stripeError &&
        stripeError.type === "StripeInvalidGrantError"
      ) {
        redirectUrl.searchParams.set("error", "invalid_authorization_code");
        redirectUrl.searchParams.set(
          "error_details",
          "The authorization code is invalid or has expired. Please try connecting again."
        );
      } else {
        redirectUrl.searchParams.set("error", "stripe_token_exchange_failed");
        redirectUrl.searchParams.set("error_details", errorMessage);
      }

      return NextResponse.redirect(redirectUrl.toString());
    }
  } catch (error: unknown) {
    console.error("Stripe callback processing error:", error);

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const redirectUrl = new URL(`${baseUrl}/settings`);
    redirectUrl.searchParams.set("error", "callback_processing_failed");

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    redirectUrl.searchParams.set("error_details", errorMessage);

    return NextResponse.redirect(redirectUrl.toString());
  }
}
