# PostHog Event Tracking Plan

## Overview
This document outlines all user actions to be tracked in the gginvoice application using PostHog analytics.

---

## Complete Event Tracking Table

| # | Category | Event Name | Location (File) | Trigger Point | Properties | Why Track |
|---|----------|------------|-----------------|---------------|------------|-----------|
| 1 | **Invoice Actions** | `invoice_saved_as_draft` | `invoice-form.tsx` (line 434-449) | "Save as Draft" button in new invoice form | `action: "draft"` | Understand user behavior when creating invoices |
| 2 | **Invoice Actions** | `invoice_saved_as_draft_and_sent` | `invoice-form.tsx` (line 442-449) | "Create & Send Invoice" button in new invoice form | `action: "send"` | Track users who immediately send vs save as draft |
| 3 | **Invoice Actions** | `invoice_updated` | `invoice-actions.tsx` (line 262-269) | "Update" button in edit page | `invoiceId: string` | Track how often users update their invoices |
| 4 | **Invoice Actions** | `invoice_sent` | `invoice-actions.tsx` (line 345-351) | "Send Invoice" button **in confirmation modal** | `invoiceId: string` | Track conversion from draft to sent status |
| 5 | **Invoice Actions** | `invoice_marked_as_paid` | `invoice-actions.tsx` (line 402-408) | "Mark as Paid" button **in confirmation modal** | `invoiceId: string` | Track manual payment recording |
| 6 | **Invoice Actions** | `invoice_refunded` | `invoice-actions.tsx` (line 460-466) | "Issue Refund" button **in confirmation modal** | `invoiceId: string` | Track refund frequency |
| 7 | **Invoice Actions** | `invoice_deleted` | `invoice-actions.tsx` (line 493-499) | "Delete Invoice" button **in confirmation modal** | `invoiceId: string` | Track deletion patterns |
| 8 | **Invoice Actions** | `invoice_restored` | `invoice-actions.tsx` (line 244-252) | "Restore" button (no modal) | `invoiceId: string` | Track restore frequency |
| 9 | **Client Management** | `client_created_from_invoice` | `use-invoice-form.ts` via `handleNewClientSubmit` | "Save Client" button in new client form inside invoice | `source: "invoice_form"` | Track inline client creation during invoice flow |
| 10 | **Client Management** | `client_created_from_clients_page` | `client-form.tsx` (line 53-118) | Form submission on `/clients/new` page | `source: "clients_page"` | Track dedicated client creation from clients page |
| 11 | **Client Management** | `client_updated` | `client-form.tsx` (line 53-118) | Form submission on edit client page | `clientId: string` | Track client information updates |
| 12 | **Stripe Integration** | `invoice_stripe_toggled` | `invoice-form.tsx` (line 361-372) | "Accept Credit Cards (Stripe)" switch toggled | `enabled: boolean`, `invoiceId: string \| null` | Track payment feature adoption per invoice |
| 13 | **Stripe Integration** | `stripe_connect_clicked` | `invoice-form.tsx` (line 384-391) | "Connect Stripe" button in invoice form alert | `source: "invoice_form"` | Track Stripe CTA engagement from invoice context |
| 14 | **Stripe Integration** | `stripe_connect_initiated` | `settings/page.tsx` (line 546-562) | "Connect to Stripe" button in Settings page | `source: "settings"` | Track Stripe onboarding starts from settings |
| 15 | **Stripe Integration** | `stripe_disconnect_clicked` | `settings/page.tsx` (line 625-630) | "Disconnect" button in Settings | `accountId: string` | Track disconnect intent before confirmation |
| 16 | **Stripe Integration** | `stripe_disconnect_confirmed` | `settings/page.tsx` (line 430-443) | "Disconnect" button **in confirmation modal** | `accountId: string` | Track actual Stripe account disconnections |
| 17 | **Onboarding** | `onboarding_step_clicked` | `onboarding-banner.tsx` (line 144-158) | Step action buttons ("Start", "Setup", "Create") | `step: string` | Track onboarding engagement and completion rates |
| 18 | **Onboarding** | `onboarding_dismissed` | `onboarding-banner.tsx` (line 55-60) | X (close) button on onboarding banner | - | Track when users skip onboarding early |
| 19 | **Navigation** | `invoice_view_clicked` | `invoices/page.tsx` (line 189-202) | "View" button in invoices table | `invoiceId: string` | Track invoice preview engagement |
| 20 | **Navigation** | `invoice_edit_clicked` | `invoices/page.tsx` (line 203-213) | "Edit" button in invoices table | `invoiceId: string` | Track how often users edit existing invoices |
| 21 | **Settings** | `settings_updated` | `settings/page.tsx` (line 232-241) | "Update Settings" button click | - | Track settings completion |
| 22 | **Settings** | `logo_upload_clicked` | `logo-upload.tsx` (line 154-172) | "Upload Logo" or "Change Logo" button | - | Track logo feature engagement |
| 23 | **Settings** | `logo_uploaded` | `logo-upload.tsx` (line 46-88) | Successful logo upload completion | - | Track successful logo uploads |
| 24 | **Settings** | `logo_removed` | `logo-upload.tsx` (line 174-194) | "Remove" button after successful deletion | - | Track logo removal frequency |
| 25 | **PDF Downloads** | `pdf_download_clicked` | `public-invoice-display.tsx` (line 215-223) | "Download PDF" button | `invoiceId: string` | Track PDF generation requests |

---

## Event Categories Summary

| Category | Event Count | Purpose |
|----------|-------------|---------|
| Invoice Actions | 8 | Track invoice lifecycle and state transitions |
| Client Management | 3 | Track client creation and updates |
| Stripe Integration | 5 | Track payment feature adoption and account management |
| Onboarding | 2 | Track user onboarding completion and engagement |
| Navigation | 2 | Track how users navigate through invoices |
| Settings | 4 | Track account configuration and personalization |
| PDF Downloads | 1 | Track document generation requests |
| **TOTAL** | **25** | **Complete user journey tracking** |

