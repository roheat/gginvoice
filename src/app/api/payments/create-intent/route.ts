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

    if (
      !invoice.user.stripeAccountId ||
      invoice.user.stripeAccountStatus !== "CONNECTED"
    ) {
      return NextResponse.json(
        { error: "Stripe account not connected" },
        { status: 400 }
      );
    }

    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: formatAmountForStripe(amount),
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      application_fee_amount: Math.round(formatAmountForStripe(amount) * 0.029), // 2.9% fee
      transfer_data: {
        destination: invoice.user.stripeAccountId,
      },
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.number,
        clientName: invoice.client.name,
      },
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Payment intent creation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create payment intent",
      },
      { status: 500 }
    );
  }
}
