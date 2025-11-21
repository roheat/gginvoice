import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        settings: true,
        invoices: {
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate step completion
    const steps = {
      company: Boolean(user.settings?.companyName),
      stripe: Boolean(user.stripeAccountId && user.stripeOnboardingComplete),
      invoice: user.invoices.length > 0,
    };

    const isComplete = Boolean(user.onboardingCompletedAt);
    // Can complete if company is set (required) - Stripe and invoice are optional
    const canComplete = steps.company;

    return NextResponse.json({
      success: true,
      isComplete,
      canComplete,
      steps,
      completedAt: user.onboardingCompletedAt,
    });
  } catch (error) {
    console.error("Error fetching onboarding status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

