import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      clientId,
      number,
      date,
      notes,
      items,
      tax1Name,
      tax1Rate,
      tax2Name,
      tax2Rate,
      discountType,
      discountValue,
      acceptCreditCards,
    }: {
      clientId: string;
      number: string;
      date: string;
      notes?: string;
      items: Array<{
        description: string;
        amount: number;
      }>;
      tax1Name?: string;
      tax1Rate?: number;
      tax2Name?: string;
      tax2Rate?: number;
      discountType?: string;
      discountValue?: number;
      acceptCreditCards?: boolean;
    } = body;

    // Create invoice with items
    const invoice = await db.invoice.create({
      data: {
        shareId: `share-${Date.now()}`,
        number,
        date: new Date(date),
        status: "DRAFT",
        subtotal: items.reduce((sum: number, item) => sum + item.amount, 0),
        tax: 0,
        total: items.reduce((sum: number, item) => sum + item.amount, 0),
        currency: "USD",
        notes: notes || null,
        discount: discountValue || 0,
        discountType: discountType || "PERCENTAGE",
        tax1Name: tax1Name || null,
        tax1Rate: tax1Rate || 0,
        tax2Name: tax2Name || null,
        tax2Rate: tax2Rate || 0,
        acceptPayments: acceptCreditCards || false,
        clientId,
        userId: session.user.id,
        items: {
          create: items.map((item) => ({
            description: item.description,
            amount: item.amount,
          })),
        },
      },
      include: {
        client: true,
        items: true,
      },
    });

    return NextResponse.json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error("Invoice creation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all invoices for the user
    const invoices = await db.invoice.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        client: true,
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      invoices,
    });
  } catch (error) {
    console.error("Invoice fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
