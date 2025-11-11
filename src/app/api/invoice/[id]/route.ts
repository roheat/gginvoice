import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
// Strongly-typed request bodies for the PUT handler
type InvoiceItemInput = {
  description: string;
  amount: number;
  quantity?: number;
};

type InvoiceUpdateBody = {
  notes?: string;
  dueDate?: string;
  items?: InvoiceItemInput[];
  tax1Name?: string;
  tax1Rate?: number;
  tax2Name?: string;
  tax2Rate?: number;
  discountType?: string;
  discountValue?: number;
  acceptCreditCards?: boolean;
};

type InvoiceUpdateData = {
  notes?: string | null;
  dueDate?: Date | null;
  acceptPayments?: boolean;
  subtotal?: number;
  tax?: number;
  total?: number;
  discount?: number;
  discountType?: string;
  tax1Name?: string;
  tax1Rate?: number;
  tax2Name?: string;
  tax2Rate?: number;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const invoice = await db.invoice.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        client: true,
        items: true,
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
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json()) as InvoiceUpdateBody;

    const {
      notes,
      dueDate,
      items,
      tax1Name,
      tax1Rate,
      tax2Name,
      tax2Rate,
      discountType,
      discountValue,
      acceptCreditCards,
    } = body;

    // Verify invoice exists and belongs to user
    const existingInvoice = await db.invoice.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        items: true,
      },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Guard: Don't allow edits on deleted invoices
    if (existingInvoice.deleted) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot edit a deleted invoice. Restore it first.",
        },
        { status: 409 }
      );
    }

    // Calculate new totals if items are being updated
    const updateData: InvoiceUpdateData = {
      notes: notes !== undefined ? notes : existingInvoice.notes,
      dueDate: dueDate ? new Date(dueDate) : existingInvoice.dueDate,
      acceptPayments:
        acceptCreditCards !== undefined
          ? acceptCreditCards
          : existingInvoice.acceptPayments,
    };

    // Update financial fields if provided (allowed regardless of invoice status, except when deleted)
    const shouldReplaceItems = Boolean(items && Array.isArray(items));
    if (shouldReplaceItems && items) {
      // Recalculate totals
      const subtotal = items.reduce((sum: number, item: InvoiceItemInput) => sum + (Number(item.amount) * (item.quantity || 1)), 0);
      const discount =
        (discountType && discountType.toLowerCase() === "percentage")
          ? (subtotal * (discountValue || 0)) / 100
          : discountValue || 0;
      const tax1 =
        tax1Rate && tax1Rate > 0
          ? ((subtotal - discount) * tax1Rate) / 100
          : 0;
      const tax2 =
        tax2Rate && tax2Rate > 0
          ? ((subtotal - discount) * tax2Rate) / 100
          : 0;
      const total = subtotal - discount + tax1 + tax2;

      updateData.subtotal = subtotal;
      updateData.tax = tax1 + tax2;
      updateData.total = total;
      updateData.discount = discount;
      updateData.discountType = discountType || "PERCENTAGE";
    }

    if (tax1Name !== undefined) updateData.tax1Name = tax1Name;
    if (tax1Rate !== undefined) updateData.tax1Rate = tax1Rate;
    if (tax2Name !== undefined) updateData.tax2Name = tax2Name;
    if (tax2Rate !== undefined) updateData.tax2Rate = tax2Rate;

    // If items were provided, perform delete/create/update in a transaction
    if (shouldReplaceItems && items) {
      // Create items with explicit invoiceId
      const createData: { description: string; amount: number; quantity: number; invoiceId: string }[] = items.map(
        (item: InvoiceItemInput) => ({
          description: item.description,
          amount: item.amount,
          quantity: item.quantity || 1,
          invoiceId: id,
        })
      );

      // Run delete + create + invoice update inside a transaction to avoid partial deletes
      await db.$transaction([
        db.invoiceItem.deleteMany({ where: { invoiceId: id } }),
        db.invoiceItem.createMany({ data: createData }),
        db.invoice.update({ where: { id }, data: updateData }),
      ]);

      const invoiceWithItems = await db.invoice.findFirst({
        where: { id },
        include: { client: true, items: true },
      });

      return NextResponse.json({
        success: true,
        invoice: invoiceWithItems,
      });
    }

    // If no items update, just update the invoice
    const updatedInvoice = await db.invoice.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        items: true,
      },
    });

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const invoice = await db.invoice.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    await db.invoice.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

