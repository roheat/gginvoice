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
}

export function InvoiceItem({
  item,
  onChange,
  onRemove,
  onDuplicate,
  canRemove,
  disabled = false,
  showQuantity = false,
}: InvoiceItemProps) {
  return (
    <div className={`border rounded-lg p-4 space-y-4 ${disabled ? "bg-gray-50 opacity-60" : ""}`}>
      <div className="grid grid-cols-1 md:grid-cols-8 gap-2">
        {/* Description */}
        <div className="col-span-3">
          <Label htmlFor={`description-${item.id}`}>Name *</Label>
          <Input
            id={`description-${item.id}`}
            disabled={disabled}
            value={item.description}
            onChange={(e) => onChange("description", e.target.value)}
            placeholder="Enter item description"
            required
          />
        </div>

        {/* Amount */}
        <div className="col-span-1">
          <Label htmlFor={`amount-${item.id}`}>Amount</Label>
          <Input
            id={`amount-${item.id}`}
            type="number"
            disabled={disabled}
            min="0"
            step="0.01"
            value={item.amount === 0 ? "" : item.amount}
            onChange={(e) => onChange("amount", Number(e.target.value) || 0)}
            placeholder="0.00"
          />
        </div>
          <div className="col-span-2 flex gap-2">
            {showQuantity && (
              <>
                <div className="flex items-end justify-center text-sm text-gray-500 mb-2">
                  ×
                </div>
                <div className="flex flex-col">
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
                <div className="flex items-end justify-center text-sm text-gray-500 mb-2">
                  <span className="mr-2">=</span>
                  <strong className="text-gray-900">
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                      Number(item.amount) * (Number(item.quantity || 1))
                    )}
                  </strong>
                </div>
              </>
            )}
          </div>
        <div className="flex items-center justify-end col-span-2 mt-6">
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
