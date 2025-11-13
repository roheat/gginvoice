import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const settingsSchema = z.object({
  companyName: z.string().optional().nullable(),
  companyAddress: z.string().optional().nullable(),
  companyPhone: z.string().optional().nullable(),
  companyEmail: z.string().optional().nullable(),
  companyWebsite: z.string().optional().nullable(),
  defaultCurrency: z.string().min(1).optional(),
  defaultTaxRate: z.preprocess((v) => (v === "" ? undefined : Number(v)), z.number().nonnegative()).optional(),
  emailNotifications: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { settings: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten().formErrors.join(", ") || "Invalid input" }, { status: 400 });
    }

    const data = parsed.data;

    // Upsert user settings (userId is unique)
    const updatedSettings = await db.userSettings.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        defaultCurrency: data.defaultCurrency || "USD",
        defaultTaxRate: data.defaultTaxRate ?? 0,
        companyName: data.companyName || null,
        companyAddress: data.companyAddress || null,
        companyPhone: data.companyPhone || null,
        companyEmail: data.companyEmail || null,
        companyWebsite: data.companyWebsite || null,
        emailNotifications: data.emailNotifications ?? true,
      },
      update: {
        defaultCurrency: data.defaultCurrency || undefined,
        defaultTaxRate: data.defaultTaxRate ?? undefined,
        companyName: data.companyName === undefined ? undefined : data.companyName,
        companyAddress: data.companyAddress === undefined ? undefined : data.companyAddress,
        companyPhone: data.companyPhone === undefined ? undefined : data.companyPhone,
        companyEmail: data.companyEmail === undefined ? undefined : data.companyEmail,
        companyWebsite: data.companyWebsite === undefined ? undefined : data.companyWebsite,
        emailNotifications: data.emailNotifications === undefined ? undefined : data.emailNotifications,
      },
    });

    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}


