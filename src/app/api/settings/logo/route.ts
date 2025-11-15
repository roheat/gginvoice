import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadCompanyLogo, deleteCompanyLogo, validateLogoFile } from "@/lib/supabase";

// Disable body parsing for file uploads
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse form data
    let formData;
    try {
      formData = await request.formData();
    } catch (error) {
      console.error("Error parsing form data:", error);
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const file = formData.get("logo") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file
    const validation = validateLogoFile(file);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Get existing settings to check for old logo
    const existingSettings = await db.userSettings.findUnique({
      where: { userId: session.user.id },
      select: { companyLogoPath: true }
    });

    // Delete old logo if exists
    if (existingSettings?.companyLogoPath) {
      try {
        await deleteCompanyLogo(existingSettings.companyLogoPath);
      } catch (error) {
        console.error("Error deleting old logo:", error);
        // Continue even if deletion fails
      }
    }

    // Upload new logo
    const { publicUrl, filePath } = await uploadCompanyLogo(session.user.id, file);

    // Update database
    const updatedSettings = await db.userSettings.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        companyLogoUrl: publicUrl,
        companyLogoPath: filePath,
      },
      update: {
        companyLogoUrl: publicUrl,
        companyLogoPath: filePath,
      },
    });

    return NextResponse.json({
      success: true,
      logoUrl: updatedSettings.companyLogoUrl,
    });
  } catch (error) {
    console.error("Logo upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get existing settings
    const existingSettings = await db.userSettings.findUnique({
      where: { userId: session.user.id },
      select: { companyLogoPath: true }
    });

    if (!existingSettings?.companyLogoPath) {
      return NextResponse.json({ error: "No logo to delete" }, { status: 404 });
    }

    // Delete from Supabase Storage
    await deleteCompanyLogo(existingSettings.companyLogoPath);

    // Update database
    await db.userSettings.update({
      where: { userId: session.user.id },
      data: {
        companyLogoUrl: null,
        companyLogoPath: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Logo deleted successfully",
    });
  } catch (error) {
    console.error("Logo deletion error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Deletion failed",
      },
      { status: 500 }
    );
  }
}

