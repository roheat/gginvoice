"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface CalculationsPanelProps {
  subtotal: number;
  discount: number;
  tax1: number;
  tax2: number;
  total: number;
  currency: string;
  tax1Name: string;
  tax2Name: string;
  items?: Array<{ description: string; amount: number; quantity?: number }>;
  discountType?: string;
  discountValue?: number;
  tax1Rate?: number;
  tax2Rate?: number;
}

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

export function CalculationsPanel({
  subtotal,
  discount,
  tax1,
  tax2,
  total,
  currency,
  tax1Name,
  tax2Name,
  items = [],
  discountType,
  discountValue,
  tax1Rate,
  tax2Rate,
}: CalculationsPanelProps) {
  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle>Invoice Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Itemized Breakdown (1) */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Items</h4>
          <div className="space-y-2 text-sm text-gray-700 mx-2">
            {items.length === 0 ? (
              <div className="flex justify-between text-sm text-gray-600">
                <span>No items</span>
                <span>{formatCurrency(0, currency)}</span>
              </div>
            ) : (
              items.map((it, idx) => {
                const qty = Number(it.quantity || 1);
                const lineTotal = Number(it.amount) * qty;
                return (
                  <div className="flex justify-between" key={(it.description || "") + idx}>
                    <span className="truncate">
                      {idx + 1}. {it.description || `Item ${idx + 1}`} {qty > 1 ? `× ${qty}` : ""}
                    </span>
                    <span>{formatCurrency(lineTotal, currency)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Subtotal (2) */}
        <Separator />
        <div className="flex justify-between text-sm text-gray-700">
          <span className="text-sm font-medium text-gray-900">Subtotal</span>
          <span>{formatCurrency(subtotal, currency)}</span>
        </div>
        <Separator />

        {/* Discount (3) */}
        {discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>
              Discount
              {discountType === "percentage" && discountValue !== undefined
                ? ` (${discountValue}%)`
                : ""}
            </span>
            <span>-{formatCurrency(discount, currency)}</span>
          </div>
        )}

        {/* Taxes (4) */}
        <h4 className="text-sm font-medium text-gray-900">Taxes</h4>
        <div className="space-y-2 text-sm text-gray-700 mx-2">
        {tax1 > 0 && (
          <div className="flex justify-between text-sm text-gray-700">
            <span>
              {tax1Name || "Tax 1"}
              {tax1Rate !== undefined ? ` (${tax1Rate}%)` : ""}
            </span>
            <span>{formatCurrency(tax1, currency)}</span>
          </div>
        )}
        {tax2 > 0 && (
          <div className="flex justify-between text-sm text-gray-700">
            <span>
              {tax2Name || "Tax 2"}
              {tax2Rate !== undefined ? ` (${tax2Rate}%)` : ""}
            </span>
            <span>{formatCurrency(tax2, currency)}</span>
          </div>
        )}
        </div>
        <Separator />

        {/* Total (5) */}
        <div className="flex justify-between items-baseline">
          <span className="text-lg font-semibold text-gray-900">Total</span>
          <span className="text-2xl font-extrabold text-blue-600">
            {formatCurrency(total, currency)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
