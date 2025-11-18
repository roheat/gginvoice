import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe, formatAmountForStripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invoiceId, amount, currency } = await request.json();

    if (!invoiceId || !amount || !currency) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get invoice details
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        user: {
          select: {
            stripeAccountId: true,
            stripeAccountStatus: true,
          },
        },
        client: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (!invoice.acceptPayments) {
      return NextResponse.json(
        { error: "This invoice does not accept payments" },
        { status: 400 }
      );
    }

    if (!invoice.user.stripeAccountId) {
      return NextResponse.json(
        { error: "Stripe account not connected" },
        { status: 400 }
      );
    }

    // Verify the account can accept payments (charges must be enabled)
    // We check this directly from Stripe rather than relying on status string
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    let account;
    try {
      account = await stripe.accounts.retrieve(invoice.user.stripeAccountId);
    } catch (error) {
      console.error("Error retrieving Stripe account:", error);
      return NextResponse.json(
        { error: "Failed to verify Stripe account" },
        { status: 500 }
      );
    }

    // Check if account can accept payments
    if (!account.charges_enabled) {
      // Check what's blocking charges
      const requirements = account.requirements;
      const currentlyDue = requirements?.currently_due || [];
      const pastDue = requirements?.past_due || [];
      const pendingVerification = requirements?.pending_verification || [];

      // Check if card_payments capability is requested but not active
      const cardPaymentsCapability = account.capabilities?.card_payments;
      const cardPaymentsStatus =
        typeof cardPaymentsCapability === "object" &&
        cardPaymentsCapability !== null &&
        "status" in cardPaymentsCapability
          ? (cardPaymentsCapability as { status: string }).status
          : typeof cardPaymentsCapability === "string"
          ? cardPaymentsCapability
          : "unknown";

      let reason = "Your Stripe account cannot accept payments yet.";
      if (cardPaymentsStatus === "pending") {
        reason =
          "The card_payments capability is pending activation. This usually happens automatically within a few minutes.";
      } else if (currentlyDue.length > 0 || pastDue.length > 0) {
        reason = `Your Stripe account needs to complete ${
          currentlyDue.length + pastDue.length
        } requirement(s). Please check your Stripe dashboard.`;
      } else if (pendingVerification.length > 0) {
        reason =
          "Your Stripe account verification is pending. This usually takes a few minutes to a few hours.";
      } else if (!account.details_submitted) {
        reason =
          "Your Stripe account needs to complete onboarding. Please check your Stripe dashboard for pending requirements.";
      }

      console.error("Account cannot accept payments:", {
        accountId: account.id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        card_payments_status: cardPaymentsStatus,
        capabilities: account.capabilities,
        requirements: {
          currentlyDue: currentlyDue.length,
          pastDue: pastDue.length,
          pendingVerification: pendingVerification.length,
        },
      });

      return NextResponse.json(
        {
          error: "Stripe account cannot accept payments yet",
          message: reason,
          accountStatus: {
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
            detailsSubmitted: account.details_submitted,
            cardPaymentsStatus: cardPaymentsStatus,
            requirementsCount: currentlyDue.length + pastDue.length,
          },
          helpUrl: `https://dashboard.stripe.com/connect/accounts/${account.id}`,
        },
        { status: 400 }
      );
    }

    // Create payment intent directly on the connected account (Direct Charges)
    // Money goes directly to the connected account, not through platform
    // Frontend will initialize Stripe with connected account context
    //
    // Note: For Direct Charges, we create the payment intent on the connected account
    // and the frontend must use that account's context to confirm it
    try {
      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount: formatAmountForStripe(amount),
          currency: currency.toLowerCase(),
          automatic_payment_methods: {
            enabled: true,
          },
          metadata: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.number,
            clientName: invoice.client.name,
            connectedAccountId: invoice.user.stripeAccountId, // Store for webhook processing
          },
        },
        {
          stripeAccount: invoice.user.stripeAccountId, // Create directly on connected account
        }
      );

      return NextResponse.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        stripeAccountId: invoice.user.stripeAccountId,
      });
    } catch (stripeError) {
      console.error("Stripe payment intent creation error:", {
        error: stripeError,
        type:
          stripeError &&
          typeof stripeError === "object" &&
          "type" in stripeError
            ? (stripeError as { type: string }).type
            : undefined,
        code:
          stripeError &&
          typeof stripeError === "object" &&
          "code" in stripeError
            ? (stripeError as { code: string }).code
            : undefined,
        message:
          stripeError instanceof Error
            ? stripeError.message
            : stripeError &&
              typeof stripeError === "object" &&
              "message" in stripeError
            ? String((stripeError as { message: unknown }).message)
            : "Unknown error",
        connectedAccountId: invoice.user.stripeAccountId,
      });
      throw stripeError; // Re-throw to be caught by outer catch block
    }
  } catch (error) {
    console.error("Payment intent creation error:", error);

    // Return more specific error messages
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to create payment intent";

    // Check for Stripe-specific errors
    if (error && typeof error === "object" && "type" in error) {
      const stripeError = error as {
        type?: string;
        message?: string;
        code?: string;
      };
      return NextResponse.json(
        {
          success: false,
          error: stripeError.message || errorMessage,
          details: {
            type: stripeError.type,
            code: stripeError.code,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
