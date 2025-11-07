import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the last invoice number
    const lastInvoice = await db.invoice.findFirst({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    let nextNumber = "INV-001";
    if (lastInvoice) {
      const match = lastInvoice.number.match(/INV-(\d+)/);
      if (match) {
        const nextNum = parseInt(match[1]) + 1;
        nextNumber = `INV-${nextNum.toString().padStart(3, "0")}`;
      }
    }

    return NextResponse.json({
      success: true,
      number: nextNumber,
    });
  } catch (error) {
    console.error("Invoice number generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
