 "use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ClientFormData {
  id?: string;
  name: string;
  email: string;
  address: string;
  phone: string;
}

type ClientFormProps = {
  initialData?: ClientFormData;
  isEditing?: boolean;
  onSuccess?: () => void;
};

export function ClientForm({ initialData, isEditing = false, onSuccess }: ClientFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ClientFormData>({
    id: initialData?.id,
    name: initialData?.name || "",
    email: initialData?.email || "",
    address: initialData?.address || "",
    phone: initialData?.phone || "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        name: initialData.name || "",
        email: initialData.email || "",
        address: initialData.address || "",
        phone: initialData.phone || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const handleInputChange = (field: keyof ClientFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error("Client name is required");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Client email is required");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        address: formData.address.trim() || null,
        phone: formData.phone.trim() || null,
      };

      let response: Response;
      if (isEditing && formData.id) {
        response = await fetch(`/api/clients/${formData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to save client");
      }

      toast.success(isEditing ? "Client updated successfully!" : "Client created successfully!");

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/clients");
      }
    } catch (error) {
      console.error("Client save error:", error);
      toast.error(isEditing ? "Failed to update client" : "Failed to create client");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Name */}
          <div>
            <Label htmlFor="name">Client Name *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter client name"
              required
            />
          </div>

          {/* Client Email */}
          <div>
            <Label htmlFor="email">Client Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Enter client email"
              required
            />
          </div>

          {/* Client Phone */}
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="Enter phone number"
            />
          </div>

          {/* Client Address */}
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Enter client address"
              rows={3}
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/clients")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (isEditing ? "Saving..." : "Creating...") : isEditing ? "Save Changes" : "Create Client"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
