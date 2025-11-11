import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { InvoiceStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await handlePaymentSucceeded(event.data.object as any);
        break;
      case "payment_intent.payment_failed":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await handlePaymentFailed(event.data.object as any);
        break;
      case "account.updated":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await handleAccountUpdated(event.data.object as any);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handlePaymentSucceeded(paymentIntent: {
  metadata: Record<string, string>;
  amount: number;
  currency: string;
  id: string;
  payment_method?: { card?: { last4?: string } } | null;
}) {
  try {
    const { invoiceId } = paymentIntent.metadata;

    if (!invoiceId) {
      console.error("No invoice ID in payment intent metadata");
      return;
    }

    // Get invoice details
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      console.error(`Invoice not found: ${invoiceId}`);
      return;
    }

    // Create payment record
    await db.payment.create({
      data: {
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency.toUpperCase(),
        stripePaymentId: paymentIntent.id,
        status: "succeeded",
        paymentMethod: `****${
          paymentIntent.payment_method?.card?.last4 || "****"
        }`,
        invoiceId: invoice.id,
      },
    });

    // Update invoice status
    await db.invoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
      },
    });

    console.log(`Payment succeeded for invoice ${invoice.number}`);
  } catch (error) {
    console.error("Error handling payment succeeded:", error);
  }
}

async function handlePaymentFailed(paymentIntent: {
  metadata: Record<string, string>;
  amount: number;
  currency: string;
  id: string;
}) {
  try {
    const { invoiceId } = paymentIntent.metadata;

    if (!invoiceId) {
      console.error("No invoice ID in payment intent metadata");
      return;
    }

    // Create payment record for failed payment
    await db.payment.create({
      data: {
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        stripePaymentId: paymentIntent.id,
        status: "failed",
        paymentMethod: "card",
        invoiceId: invoiceId,
      },
    });

    console.log(`Payment failed for invoice ${invoiceId}`);
  } catch (error) {
    console.error("Error handling payment failed:", error);
  }
}

async function handleAccountUpdated(account: {
  id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
}) {
  try {
    // Find user by Stripe account ID
    const user = await db.user.findFirst({
      where: { stripeAccountId: account.id },
    });

    if (!user) {
      console.error(`User not found for Stripe account: ${account.id}`);
      return;
    }

    // Update user's Stripe status
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

    console.log(`Updated Stripe status for user ${user.id}: ${status}`);
  } catch (error) {
    console.error("Error handling account updated:", error);
  }
}
