import {
  User,
  Client,
  Invoice,
  InvoiceItem,
  UserSettings,
} from "@prisma/client";

export type UserWithSettings = User & {
  settings?: UserSettings | null;
};

export type ClientWithInvoices = Client & {
  invoices: Invoice[];
};

export type InvoiceWithDetails = Invoice & {
  client: Client;
  items: InvoiceItem[];
};

export type InvoiceItemWithInvoice = InvoiceItem & {
  invoice: Invoice;
};

export type UserStats = {
  totalInvoices: number;
  paidInvoices: number;
  totalRevenue: number;
};

export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "REFUNDED" | "OVERDUE";

export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "CANCELED";

export type DiscountType = "PERCENTAGE" | "AMOUNT";
