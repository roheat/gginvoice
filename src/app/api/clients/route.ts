import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const createClientSchema = z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Invalid email address"),
      address: z.string().optional().nullable(),
      phone: z.string().optional().nullable(),
    });

    const parsed = createClientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().formErrors.join(", ") || "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, address, phone } = parsed.data;

    // Check if client with same email already exists for this user
    if (email) {
      const existingClient = await db.client.findFirst({
        where: {
          userId: session.user.id,
          email: email.trim(),
        },
      });

      if (existingClient) {
        return NextResponse.json(
          {
            success: false,
            error: "A client with this email already exists",
          },
          { status: 409 }
        );
      }
    }

    const client = await db.client.create({
      data: {
        name,
        email,
        address: address || null,
        phone: phone || null,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      client,
    });
  } catch (error: any) {
    console.error("Client creation error:", error);
    
    // Handle Prisma unique constraint violation
    if (error.code === "P2002" && error.meta?.target?.includes("email")) {
      return NextResponse.json(
        {
          success: false,
          error: "A client with this email already exists",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all clients for the user
    const clients = await db.client.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      clients,
    });
  } catch (error) {
    console.error("Client fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
