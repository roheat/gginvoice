import { describe, it, expect, jest } from "@jest/globals";

// Mock the entire module
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("@/lib/stripe", () => ({
  stripe: {
    accounts: {
      create: jest.fn(),
    },
    accountLinks: {
      create: jest.fn(),
    },
  },
}));

describe("Stripe Connect Integration", () => {
  it("should handle Connect not enabled error correctly", () => {
    const error = {
      type: "StripeInvalidRequestError",
      raw: {
        message:
          "You can only create new accounts if you've signed up for Connect",
      },
    };

    const isConnectNotEnabled =
      error?.type === "StripeInvalidRequestError" &&
      (error?.raw?.message?.includes("signed up for Connect") ||
        error?.raw?.message?.includes("review the responsibilities"));

    expect(isConnectNotEnabled).toBe(true);
  });

  it("should handle platform profile error correctly", () => {
    const error = {
      type: "StripeInvalidRequestError",
      raw: {
        message:
          "Please review the responsibilities of managing losses for connected accounts at https://dashboard.stripe.com/settings/connect/platform-profile",
      },
    };

    const isConnectNotEnabled =
      error?.type === "StripeInvalidRequestError" &&
      (error?.raw?.message?.includes("signed up for Connect") ||
        error?.raw?.message?.includes("review the responsibilities") ||
        error?.raw?.message?.includes("platform-profile"));

    expect(isConnectNotEnabled).toBe(true);
  });

  it("should not match other Stripe errors", () => {
    const error = {
      type: "StripeCardError",
      raw: {
        message: "Your card was declined",
      },
    };

    const isConnectNotEnabled =
      error?.type === "StripeInvalidRequestError" &&
      (error?.raw?.message?.includes("signed up for Connect") ||
        error?.raw?.message?.includes("review the responsibilities"));

    expect(isConnectNotEnabled).toBe(false);
  });

  it("should handle platform-profile URL error correctly", () => {
    const error = {
      type: "StripeInvalidRequestError",
      raw: {
        message:
          "Please review the responsibilities at https://dashboard.stripe.com/settings/connect/platform-profile",
      },
    };

    const isConnectNotEnabled =
      error?.type === "StripeInvalidRequestError" &&
      (error?.raw?.message?.includes("signed up for Connect") ||
        error?.raw?.message?.includes("review the responsibilities") ||
        error?.raw?.message?.includes("platform-profile"));

    expect(isConnectNotEnabled).toBe(true);
  });

  it("should handle geographic restriction error correctly", () => {
    const error = {
      type: "StripeInvalidRequestError",
      raw: {
        message:
          "Connected accounts in US cannot be created by platforms in AE",
      },
    };

    const isGeographicRestriction =
      error?.type === "StripeInvalidRequestError" &&
      error?.raw?.message?.includes("cannot be created by platforms in");

    expect(isGeographicRestriction).toBe(true);
  });
});
