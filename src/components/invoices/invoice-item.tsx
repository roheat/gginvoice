"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Copy } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export interface InvoiceItemData {
  id: string;
  description: string;
  amount: number;
  quantity?: number | string;
  showQuantity?: boolean;
}

interface InvoiceItemProps {
  item: InvoiceItemData;
  index: number;
  onChange: (field: keyof InvoiceItemData, value: string | number | boolean) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  canRemove: boolean;
  disabled?: boolean;
  showQuantity?: boolean;
  errors?: { description?: boolean; amount?: boolean };
}

export function InvoiceItem({
  item,
  onChange,
  onRemove,
  onDuplicate,
  canRemove,
  disabled = false,
  showQuantity = false,
  errors,
}: InvoiceItemProps) {
  const hasErrors = errors && (errors.description || errors.amount);
  
  return (
    <div 
      id={`item-${item.id}`}
      className={`border rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4 transition-colors ${
        disabled ? "bg-gray-50 opacity-60" : ""
      } ${
        hasErrors ? "border-red-300 bg-red-50/30" : "border-gray-200"
      }`}
    >
      <div className="grid grid-cols-1 md:grid-cols-8 gap-3 sm:gap-2">
        {/* Description */}
        <div className="md:col-span-3">
          <Label htmlFor={`description-${item.id}`} className={errors?.description ? "text-red-600" : ""}>
            Description *
          </Label>
          <Input
            id={`description-${item.id}`}
            disabled={disabled}
            value={item.description}
            onChange={(e) => onChange("description", e.target.value)}
            placeholder="Enter item description"
            required
            className={errors?.description ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {errors?.description && (
            <p className="text-xs text-red-600 mt-1">Description is required</p>
          )}
        </div>

        {/* Amount */}
        <div className="md:col-span-1">
          <Label htmlFor={`amount-${item.id}`} className={errors?.amount ? "text-red-600" : ""}>
            Amount *
          </Label>
          <Input
            id={`amount-${item.id}`}
            type="number"
            disabled={disabled}
            min="0"
            step="0.01"
            value={item.amount === 0 ? "" : item.amount}
            onChange={(e) => onChange("amount", Number(e.target.value) || 0)}
            placeholder="0.00"
            className={errors?.amount ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {errors?.amount && (
            <p className="text-xs text-red-600 mt-1">Amount must be greater than 0</p>
          )}
        </div>
          <div className="md:col-span-2 flex flex-wrap items-end gap-2">
            {showQuantity && (
              <>
                <div className="hidden md:flex items-end justify-center text-sm text-gray-500 mb-2">
                  ×
                </div>
                <div className="flex flex-col flex-1 md:flex-initial min-w-[100px]">
                  <Label htmlFor={`quantity-${item.id}`}>Quantity</Label>
                  <Input
                    id={`quantity-${item.id}`}
                    type="number"
                    disabled={disabled}
                    min="1"
                    step="1"
                    value={
                      item.quantity === "" 
                        ? "" 
                        : item.quantity === undefined || item.quantity === 0 
                          ? 1 
                          : item.quantity
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "") {
                        onChange("quantity", "");
                        return;
                      }
                      const parsed = Number(value);
                      onChange("quantity", Math.max(1, parsed || 1));
                    }}
                    placeholder="1"
                  />
                </div>
                <div className="flex items-end text-sm text-gray-500 mb-2">
                  <span className="mr-2">=</span>
                  <strong className="text-gray-900 whitespace-nowrap">
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                      Number(item.amount) * (Number(item.quantity || 1))
                    )}
                  </strong>
                </div>
              </>
            )}
          </div>
        <div className="flex items-center justify-end md:col-span-2 md:mt-6">
          <div className="flex items-center gap-1">
            <Switch
              id={`show-qty-${item.id}`}
              checked={Boolean(showQuantity)}
            onCheckedChange={(v) => onChange("showQuantity", Boolean(v))}
            />
            <span className="text-xs text-gray-500">Qty</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDuplicate}
            disabled={disabled}
            title="Duplicate item"
          >
            <Copy className="h-4 w-4" />
          </Button>
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              disabled={disabled}
              title="Remove item"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
