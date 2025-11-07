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
}: CalculationsPanelProps) {
  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle>Invoice Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Subtotal */}
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Subtotal</span>
          <span className="text-sm font-medium">
            {formatCurrency(subtotal, currency)}
          </span>
        </div>

        {/* Discount */}
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span className="text-sm">Discount</span>
            <span className="text-sm font-medium">
              -{formatCurrency(discount, currency)}
            </span>
          </div>
        )}

        {/* Tax 1 */}
        {tax1 > 0 && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">{tax1Name || "Tax 1"}</span>
            <span className="text-sm font-medium">
              {formatCurrency(tax1, currency)}
            </span>
          </div>
        )}

        {/* Tax 2 */}
        {tax2 > 0 && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">{tax2Name || "Tax 2"}</span>
            <span className="text-sm font-medium">
              {formatCurrency(tax2, currency)}
            </span>
          </div>
        )}

        <Separator />

        {/* Total */}
        <div className="flex justify-between">
          <span className="text-lg font-semibold text-gray-900">Total</span>
          <span className="text-lg font-bold text-blue-600">
            {formatCurrency(total, currency)}
          </span>
        </div>

        {/* Breakdown */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Breakdown</h4>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Items: {subtotal > 0 ? "1" : "0"}</span>
              <span>{formatCurrency(subtotal, currency)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-{formatCurrency(discount, currency)}</span>
              </div>
            )}
            {tax1 > 0 && (
              <div className="flex justify-between">
                <span>{tax1Name || "Tax 1"}:</span>
                <span>{formatCurrency(tax1, currency)}</span>
              </div>
            )}
            {tax2 > 0 && (
              <div className="flex justify-between">
                <span>{tax2Name || "Tax 2"}:</span>
                <span>{formatCurrency(tax2, currency)}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
