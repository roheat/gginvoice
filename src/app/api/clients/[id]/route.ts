import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

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

    const client = await db.client.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, client });
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
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
    const body = await request.json();

    const updateClientSchema = z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Invalid email address"),
      address: z.string().optional().nullable(),
      phone: z.string().optional().nullable(),
    });

    const parsed = updateClientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().formErrors.join(", ") || "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, address, phone } = parsed.data;

    // Verify client exists and belongs to current user
    const existingClient = await db.client.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingClient) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 }
      );
    }

    const updatedClient = await db.client.update({
      where: { id },
      data: {
        name: name.toString().trim(),
        email: email ? email.toString().trim() : null,
        address: address === undefined ? existingClient.address : address || null,
        phone: phone === undefined ? existingClient.phone : phone || null,
      },
    });

    return NextResponse.json({ success: true, client: updatedClient });
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
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

    const client = await db.client.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 }
      );
    }

    await db.client.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Client deleted" });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}


