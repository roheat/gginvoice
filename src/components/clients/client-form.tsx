 "use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { posthog } from "@/lib/posthog";

interface ClientFormData {
  id?: string;
  name: string;
  email: string;
  address: string;
  phone: string;
}

interface ValidationErrors {
  name?: string;
  email?: string;
  address?: string;
  phone?: string;
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
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<keyof Omit<ClientFormData, "id">>>(new Set());

  // Store initial form data for dirty check
  const initialFormData = useMemo<ClientFormData>(() => {
    return {
      id: initialData?.id,
      name: initialData?.name || "",
      email: initialData?.email || "",
      address: initialData?.address || "",
      phone: initialData?.phone || "",
    };
  }, [initialData]);

  useEffect(() => {
    if (initialData) {
      const newFormData = {
        id: initialData.id,
        name: initialData.name || "",
        email: initialData.email || "",
        address: initialData.address || "",
        phone: initialData.phone || "",
      };
      setFormData(newFormData);
      // Reset touched fields when initial data changes
      setTouchedFields(new Set());
      setValidationErrors({});
    }
  }, [initialData]);

  // Check if form is dirty (has been modified from initial values)
  const isDirty = useMemo(() => {
    if (!isEditing) {
      // For new clients, form is dirty if any field has a value
      return formData.name.trim() !== "" || 
             formData.email.trim() !== "" || 
             formData.address.trim() !== "" || 
             formData.phone.trim() !== "";
    }
    // For editing, compare with initial values
    return formData.name !== initialFormData.name ||
           formData.email !== initialFormData.email ||
           formData.address !== initialFormData.address ||
           formData.phone !== initialFormData.phone;
  }, [formData, initialFormData, isEditing]);

  // Validate a single field
  const validateField = (field: keyof Omit<ClientFormData, "id">, value: string): string | undefined => {
    switch (field) {
      case "name":
        if (!value.trim()) {
          return "Client name is required";
        }
        break;
      case "email":
        if (!value.trim()) {
          return "Client email is required";
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) {
          return "Please enter a valid email address";
        }
        break;
      default:
        break;
    }
    return undefined;
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    const nameError = validateField("name", formData.name);
    if (nameError) errors.name = nameError;

    const emailError = validateField("email", formData.email);
    if (emailError) errors.email = emailError;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof Omit<ClientFormData, "id">, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Mark field as touched
    setTouchedFields((prev) => new Set(prev).add(field));
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Validate field in real-time if it's been touched
    if (touchedFields.has(field)) {
      const error = validateField(field, value);
      if (error) {
        setValidationErrors((prev) => ({ ...prev, [field]: error }));
      }
    }
  };

  const handleBlur = (field: keyof Omit<ClientFormData, "id">) => {
    setTouchedFields((prev) => new Set(prev).add(field));
    const error = validateField(field, formData[field]);
    if (error) {
      setValidationErrors((prev) => ({ ...prev, [field]: error }));
    } else {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouchedFields(new Set(["name", "email", "address", "phone"]));

    // Validate form
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    // Check if form is dirty (only for editing)
    if (isEditing && !isDirty) {
      toast.info("No changes to save");
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
        // Handle duplicate email error
        if (response.status === 409 && result.error?.includes("email")) {
          setValidationErrors((prev) => ({
            ...prev,
            email: "A client with this email already exists",
          }));
          setTouchedFields((prev) => new Set(prev).add("email"));
          toast.error("A client with this email already exists");
          return;
        }
        throw new Error(result.error || "Failed to save client");
      }

      // Track client creation/update
      if (isEditing) {
        posthog.capture("client_updated", {
          clientId: formData.id,
        });
      } else {
        posthog.capture("client_created_from_clients_page", {
          source: "clients_page",
        });
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
              onBlur={() => handleBlur("name")}
              placeholder="Enter client name"
              className={validationErrors.name ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20" : ""}
              aria-invalid={!!validationErrors.name}
              aria-describedby={validationErrors.name ? "name-error" : undefined}
            />
            {validationErrors.name && touchedFields.has("name") && (
              <p id="name-error" className="mt-1 text-sm text-red-600">
                {validationErrors.name}
              </p>
            )}
          </div>

          {/* Client Email */}
          <div>
            <Label htmlFor="email">Client Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              placeholder="Enter client email"
              className={validationErrors.email ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20" : ""}
              aria-invalid={!!validationErrors.email}
              aria-describedby={validationErrors.email ? "email-error" : undefined}
            />
            {validationErrors.email && touchedFields.has("email") && (
              <p id="email-error" className="mt-1 text-sm text-red-600">
                {validationErrors.email}
              </p>
            )}
          </div>

          {/* Client Phone */}
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              onBlur={() => handleBlur("phone")}
              placeholder="Enter phone number"
              className={validationErrors.phone ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20" : ""}
              aria-invalid={!!validationErrors.phone}
              aria-describedby={validationErrors.phone ? "phone-error" : undefined}
            />
            {validationErrors.phone && touchedFields.has("phone") && (
              <p id="phone-error" className="mt-1 text-sm text-red-600">
                {validationErrors.phone}
              </p>
            )}
          </div>

          {/* Client Address */}
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              onBlur={() => handleBlur("address")}
              placeholder="Enter client address"
              rows={3}
              className={validationErrors.address ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20" : ""}
              aria-invalid={!!validationErrors.address}
              aria-describedby={validationErrors.address ? "address-error" : undefined}
            />
            {validationErrors.address && touchedFields.has("address") && (
              <p id="address-error" className="mt-1 text-sm text-red-600">
                {validationErrors.address}
              </p>
            )}
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
            <Button 
              type="submit" 
              disabled={isSubmitting || (isEditing && !isDirty) || Object.keys(validationErrors).length > 0}
            >
              {isSubmitting ? (isEditing ? "Saving..." : "Creating...") : isEditing ? "Save Changes" : "Create Client"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
