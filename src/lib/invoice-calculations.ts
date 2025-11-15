/**
 * Single source of truth for invoice calculations
 * Used by both frontend (for preview) and backend (for persistence)
 */

export type InvoiceItem = {
  amount: number;
  quantity: number;
};

export type DiscountConfig = {
  type: 'PERCENTAGE' | 'AMOUNT' | string; // Allow any string for flexible input
  value: number;
};

export type TaxConfig = {
  tax1Rate: number;
  tax2Rate: number;
};

export type InvoiceCalculation = {
  subtotal: number;
  discount: number;
  tax1: number;
  tax2: number;
  tax: number;
  total: number;
};

/**
 * Calculate all invoice financial values
 * 
 * @param items - Array of invoice items with amount and quantity
 * @param discountConfig - Discount configuration (type and value)
 * @param taxConfig - Tax configuration (tax1Rate and tax2Rate)
 * @returns Calculated financial values (subtotal, discount, taxes, total)
 * 
 * Calculation order:
 * 1. Subtotal = sum of (item.amount * item.quantity)
 * 2. Discount = percentage of subtotal OR fixed amount
 * 3. Tax1 = (subtotal - discount) * tax1Rate / 100
 * 4. Tax2 = (subtotal - discount) * tax2Rate / 100
 * 5. Total = subtotal - discount + tax1 + tax2
 */
export function calculateInvoice(
  items: InvoiceItem[],
  discountConfig: DiscountConfig,
  taxConfig: TaxConfig
): InvoiceCalculation {
  // 1. Calculate subtotal from all items
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.amount) * Number(item.quantity || 1),
    0
  );

  // 2. Calculate discount (percentage or fixed amount)
  // Normalize to uppercase for consistent comparison
  const discountType = discountConfig.type.toUpperCase();
  const discount =
    discountType === 'PERCENTAGE'
      ? (subtotal * Number(discountConfig.value)) / 100
      : Number(discountConfig.value);

  // 3. Calculate taxable amount (after discount)
  const taxableAmount = subtotal - discount;

  // 4. Calculate individual taxes
  const tax1 = (taxableAmount * Number(taxConfig.tax1Rate)) / 100;
  const tax2 = (taxableAmount * Number(taxConfig.tax2Rate)) / 100;
  const tax = tax1 + tax2;

  // 5. Calculate final total
  const total = subtotal - discount + tax;

  return {
    subtotal: Math.max(0, subtotal),
    discount: Math.max(0, discount),
    tax1: Math.max(0, tax1),
    tax2: Math.max(0, tax2),
    tax: Math.max(0, tax),
    total: Math.max(0, total),
  };
}

