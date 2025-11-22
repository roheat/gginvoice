"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { posthog } from "@/lib/posthog";

interface LogoUploadProps {
  currentLogoUrl?: string | null;
  onLogoUpdate: (logoUrl: string | null) => void;
}

export function LogoUpload({ currentLogoUrl, onLogoUpdate }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (1MB)
    if (file.size > 1024 * 1024) {
      toast.error("File size must be less than 1MB");
      return;
    }

    // Validate file type - only PNG and JPG allowed
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("File must be PNG or JPG");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);

      const response = await fetch("/api/settings/logo", {
        method: "POST",
        body: formData,
      });

      // Get response text first
      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        console.error("Response text:", responseText);
        toast.error("Server error - check console for details");
        setPreviewUrl(currentLogoUrl || null);
        return;
      }

      if (response.ok && data.success) {
        // Track logo uploaded
        posthog.capture("logo_uploaded");

        toast.success("Logo uploaded successfully");
        onLogoUpdate(data.logoUrl);
        setPreviewUrl(data.logoUrl);
      } else {
        toast.error(data.error || "Failed to upload logo");
        setPreviewUrl(currentLogoUrl || null);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload logo");
      setPreviewUrl(currentLogoUrl || null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async () => {
    if (!currentLogoUrl) return;

    setDeleting(true);
    try {
      const response = await fetch("/api/settings/logo", {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Track logo removed
        posthog.capture("logo_removed");

        toast.success("Logo deleted successfully");
        onLogoUpdate(null);
        setPreviewUrl(null);
      } else {
        toast.error(data.error || "Failed to delete logo");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete logo");
    } finally {
      setDeleting(false);
    }
  };

  const handleUploadClick = () => {
    // Track logo upload clicked
    posthog.capture("logo_upload_clicked");
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <Label>Company Logo</Label>
      <div className="flex items-start gap-4">
        {/* Preview */}
        <div className="flex-shrink-0">
          {previewUrl ? (
            <div className="relative w-32 h-20 border-2 border-gray-200 rounded-lg overflow-hidden bg-white flex items-center justify-center">
              <Image
                src={previewUrl}
                alt="Company logo"
                fill
                className="object-contain p-2"
                unoptimized={previewUrl.startsWith('data:')}
              />
            </div>
          ) : (
            <div className="w-32 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex-1 space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUploadClick}
              disabled={uploading || deleting}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {previewUrl ? "Change Logo" : "Upload Logo"}
                </>
              )}
            </Button>

            {previewUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={uploading || deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </>
                )}
              </Button>
            )}
          </div>

          <p className="text-xs text-gray-500">
            PNG or JPG only. Max 1MB. Recommended: 240x120px
          </p>
        </div>
      </div>
    </div>
  );
}

