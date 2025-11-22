"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, Minus } from "lucide-react";

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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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
  const hasItems = items.length > 0;
  const hasDiscount = discount > 0;
  const hasTaxes = tax1 > 0 || tax2 > 0;
  const itemCount = items.length;
  const validItems = items.filter(item => item.description && item.description.trim() !== "" && Number(item.amount) > 0);

  return (
    <Card className="sticky top-6 shadow-sm border-gray-200">
      <CardHeader className="pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <CardTitle className="text-base font-semibold text-gray-900">Invoice Summary</CardTitle>
          </div>
          {hasItems && (
            <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md">
              {itemCount}
            </span>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        {/* Items Section */}
        <div className="mb-5">
          {!hasItems ? (
            <div className="py-8 px-4 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">No items yet</p>
              <p className="text-xs text-gray-500">Add items to your invoice to see the breakdown</p>
            </div>
          ) : validItems.length === 0 ? (
            <div className="py-6 px-4 text-center border border-dashed border-gray-200 rounded-lg bg-gray-50/50">
              <p className="text-sm text-gray-500 mb-1">Items need description and amount</p>
              <p className="text-xs text-gray-400">Complete item details to see calculations</p>
            </div>
          ) : (
            <div className="space-y-0">
              {items.map((it, idx) => {
                const qty = Number(it.quantity || 1);
                const amount = Number(it.amount) || 0;
                const lineTotal = amount * qty;
                const hasDescription = it.description && it.description.trim() !== "";
                const isEmpty = !hasDescription || amount === 0;
                
                if (isEmpty) return null;
                
                return (
                  <div 
                    className="flex justify-between items-start gap-4 py-3 border-b border-gray-100 last:border-0 first:pt-0" 
                    key={(it.description || "") + idx}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-sm font-medium text-gray-900 leading-snug break-words">
                        {it.description}
                      </p>
                      {qty > 1 && (
                        <p className="text-xs text-gray-500 mt-1.5 font-normal">
                          {formatCurrency(amount, currency)} <span className="text-gray-400">×</span> {qty}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-900 whitespace-nowrap flex-shrink-0">
                      {formatCurrency(lineTotal, currency)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Calculations Section */}
        <div className="space-y-2.5">
          {/* Subtotal */}
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600 font-normal">Subtotal</span>
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(subtotal, currency)}
            </span>
          </div>

          {/* Discount */}
          {hasDiscount && (
            <div className="flex justify-between items-center py-2 px-3 -mx-3 bg-green-50 rounded-md border border-green-100">
              <span className="text-sm text-green-700 font-medium">
                Discount
                {discountType === "percentage" && discountValue !== undefined && discountValue > 0
                  ? ` (${discountValue}%)`
                  : ""}
              </span>
              <span className="text-sm font-semibold text-green-700">
                <Minus className="inline h-3 w-3 mr-0.5" />
                {formatCurrency(discount, currency)}
              </span>
            </div>
          )}

          {/* Taxes */}
          {hasTaxes ? (
            <div className="space-y-2 pt-1">
              {tax1 > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600 font-normal">
                    {tax1Name || "Tax 1"}
                    {tax1Rate !== undefined && tax1Rate > 0 ? (
                      <span className="text-gray-400 font-normal"> ({tax1Rate}%)</span>
                    ) : ""}
                  </span>
                  <span className="text-sm font-semibold text-gray-700">
                    {formatCurrency(tax1, currency)}
                  </span>
                </div>
              )}
              {tax2 > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600 font-normal">
                    {tax2Name || "Tax 2"}
                    {tax2Rate !== undefined && tax2Rate > 0 ? (
                      <span className="text-gray-400 font-normal"> ({tax2Rate}%)</span>
                    ) : ""}
                  </span>
                  <span className="text-sm font-semibold text-gray-700">
                    {formatCurrency(tax2, currency)}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-400 font-normal">No taxes</span>
              <span className="text-sm font-semibold text-gray-400">
                {formatCurrency(0, currency)}
              </span>
            </div>
          )}
        </div>

        {/* Total */}
        <Separator className="my-4 bg-gray-200" />
        <div className="flex justify-between items-baseline pt-1">
          <span className="text-base font-bold text-gray-900">Total</span>
          <span className="text-2xl font-extrabold text-blue-600 tracking-tight">
            {formatCurrency(total, currency)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
