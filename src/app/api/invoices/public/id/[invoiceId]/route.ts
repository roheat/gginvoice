import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params;

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: "Invoice ID is required" },
        { status: 400 }
      );
    }

    const invoice = await db.invoice.findUnique({
      where: {
        id: invoiceId,
      },
      include: {
        client: true,
        items: true,
        user: {
          select: {
            name: true,
            email: true,
            company: true,
            settings: {
              select: {
                companyName: true,
                companyAddress: true,
                companyPhone: true,
                companyWebsite: true,
                companyLogoUrl: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error("Error fetching public invoice by id:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch invoice",
      },
      { status: 500 }
    );
  }
}

