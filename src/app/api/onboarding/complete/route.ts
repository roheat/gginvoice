import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify requirements met (only company required)
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        settings: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const hasCompany = Boolean(user.settings?.companyName);

    if (!hasCompany) {
      return NextResponse.json(
        { error: "Company setup required" },
        { status: 400 }
      );
    }

    // Mark as completed
    const updated = await db.user.update({
      where: { id: session.user.id },
      data: { onboardingCompletedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      completedAt: updated.onboardingCompletedAt,
    });
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

