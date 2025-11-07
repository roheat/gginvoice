"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Copy } from "lucide-react";

interface InvoiceItemData {
  id: string;
  description: string;
  amount: number;
}

interface InvoiceItemProps {
  item: InvoiceItemData;
  index: number;
  onChange: (field: keyof InvoiceItemData, value: string | number) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  canRemove: boolean;
}

export function InvoiceItem({
  item,
  index,
  onChange,
  onRemove,
  onDuplicate,
  canRemove,
}: InvoiceItemProps) {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">Item {index + 1}</h4>
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDuplicate}
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
              title="Remove item"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* Description */}
        <div>
          <Label htmlFor={`description-${item.id}`}>Description *</Label>
          <Input
            id={`description-${item.id}`}
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
            min="0"
            step="0.01"
            value={item.amount === 0 ? "" : item.amount}
            onChange={(e) => onChange("amount", Number(e.target.value) || 0)}
            placeholder="0.00"
          />
        </div>
      </div>
    </div>
  );
}
