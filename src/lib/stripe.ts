import Stripe from "stripe";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-08-27.basil",
      typescript: true,
    })
  : null;

export const STRIPE_CONFIG = {
  // Use test mode if not in production
  testMode: process.env.NODE_ENV !== "production",

  // Stripe Connect settings
  connect: {
    // Use Express accounts for easier onboarding
    accountType: "express" as const,

    // Capabilities to request
    capabilities: ["card_payments", "transfers"],

    // Business type
    businessType: "individual" as const,
  },

  // Webhook settings
  webhook: {
    // Webhook endpoint secret
    secret: process.env.STRIPE_WEBHOOK_SECRET,

    // Events to listen for
    events: [
      "account.updated",
      "payment_intent.succeeded",
      "payment_intent.payment_failed",
    ],
  },

  // Payment settings
  payment: {
    // Currency
    currency: "usd",

    // Payment method types
    paymentMethodTypes: ["card"],

    // Automatic payment methods
    automaticPaymentMethods: {
      enabled: true,
    },
  },
};

export const getStripePublishableKey = () => {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
};

export const formatAmountForStripe = (amount: number) => {
  // Convert to cents for Stripe
  return Math.round(amount * 100);
};

export const formatAmountFromStripe = (amount: number) => {
  // Convert from cents to dollars
  return amount / 100;
};
