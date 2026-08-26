# Requirements: Invoicing & Hosted Payment

## Problem Statement

Merchants often need to collect payment asynchronously — after completing a service, delivering goods, or billing for recurring work. They need to create professional invoices, send them to customers, and provide a seamless payment experience. Without invoicing, merchants must rely on external tools or manual follow-up, creating friction and delayed cash flow.

## User Persona

**Merchant Administrator** — creates invoices after completing work for clients, sends them via email, and monitors payment status. Deals with 5–20 invoices per month and needs to quickly see what's outstanding, overdue, or paid.

**Customer (payer)** — receives an invoice via email and wants to pay quickly and securely through a branded payment page without creating an account or logging in.

## Functional Requirements

### FR-1: Invoice Creation
- FR-1.1: An "Add Invoice" action must open an invoice creation form.
- FR-1.2: Required fields: customer (selector), description, amount, issue date (default today), due date.
- FR-1.3: Optional: apply merchant's configured tax rate (toggle, like VT).
- FR-1.4: Display calculated subtotal, tax (if applied), and total.
- FR-1.5: Auto-generate invoice number (e.g., INV-001, INV-002, incrementing).
- FR-1.6: Allow saving as Draft (editable, not sent) or directly as Outstanding (implies ready to send).
- FR-1.7: On creation, navigate to the invoice detail view.
- FR-1.8: From the Customer Detail page, a "Create Invoice" action must open the invoice creation form with the customer pre-selected and locked (not editable). This allows merchants to quickly invoice a customer they are already viewing.

### FR-2: Invoice Management List
- FR-2.1: Display summary metrics at top: Outstanding Amount, Overdue Amount, Paid This Month, Total Invoice Count.
- FR-2.2: List all invoices with columns: invoice number, customer, amount, status, due date, issued date.
- FR-2.3: Support search by invoice number, customer name, or customer email.
- FR-2.4: Filter by status: All, Draft, Outstanding, Overdue, Paid, Written Off, Refunded.
- FR-2.5: Filter by customer (dropdown).
- FR-2.6: Filter by due date range.
- FR-2.7: All date range filters must enforce: "To" date cannot be earlier than "From" date, neither can be in the future, and changing "From" to a date after "To" must auto-clear "To". All amount range filters must enforce: Max cannot be less than Min, and changing Min above Max must auto-clear Max. Show inline error messages for invalid states.
- FR-2.8: Visually emphasize overdue invoices (red/warning styling on row or badge).
- FR-2.9: Sort by due date (soonest first) by default, with overdue sorted to top.

### FR-3: Invoice Detail View
- FR-3.1: Show full invoice at `/invoices/:id` with: invoice number, status badge, customer info, description, amount breakdown (subtotal, tax, total), issue date, due date, sent timestamp, payment date (if paid).
- FR-3.2: Show related transaction(s) if invoice is Paid (link to transaction detail).
- FR-3.3: Provide action buttons appropriate to current status.

### FR-4: Send Invoice
- FR-4.1: For Draft invoices, provide a "Send Invoice" action.
- FR-4.2: Sending must: change status from Draft to Outstanding, record a sentAt timestamp.
- FR-4.3: On send, show an email preview modal (see FR-8) with confirmation.
- FR-4.4: After confirmation, show a success toast: "Invoice sent to [customer email]."
- FR-4.5: Outstanding invoices can be "re-sent" (updates sentAt, shows same flow).

### FR-5: Write Off
- FR-5.1: For Outstanding or Overdue invoices, provide a "Write Off" action.
- FR-5.2: Show confirmation modal explaining the action is irreversible.
- FR-5.3: On confirm, change status to "Written Off" and set writtenOffAt timestamp.
- FR-5.4: Written Off invoices have no further actions available.

### FR-6: Invoice Refund
- FR-6.1: For Paid invoices, provide a "Refund Payment" action.
- FR-6.2: Show confirmation modal with invoice details and refund amount.
- FR-6.3: On confirm: create a linked refund transaction, update invoice status to "Refunded", set refundedAt timestamp.
- FR-6.4: Update the linked payment transaction to "refunded" status as well.

### FR-7: Send Reminder
- FR-7.1: For Overdue invoices, provide a "Send Reminder" action.
- FR-7.2: On click, update lastReminderSentAt timestamp and show success toast.
- FR-7.3: Show "Last reminder sent: [date]" in the invoice detail when applicable.
- FR-7.4: Show an email preview for "Invoice Overdue" reminder template.

### FR-8: Email Preview Templates
- FR-8.1: When sending an invoice, display an email preview modal showing a styled "New Invoice" email template.
- FR-8.2: Template must include: merchant logo, merchant name (branding), customer name, invoice number, amount due, due date, and a "View and Pay Invoice" CTA button.
- FR-8.3: Provide additional preview templates for: Invoice Paid (confirmation), Invoice Overdue (reminder), Invoice Refunded (notification).
- FR-8.4: All templates must apply the merchant's configured branding (colors, name, logo).
- FR-8.5: All "send" actions update only local state and show toasts — never send real email.

### FR-9: Hosted Invoice Payment Page
- FR-9.1: Route `/pay/:invoiceId` must render a standalone customer-facing payment page (no app shell).
- FR-9.2: Apply merchant branding: display name, logo, primary color, secondary color.
- FR-9.3: Show: invoice number, description, amount due, due date, customer name.
- FR-9.4: Display a fictional card payment form with clear prototype messaging.
- FR-9.5: On valid submission, simulate payment (1.5–2s processing delay).
- FR-9.6: On approval: show a branded "Payment Successful" confirmation with receipt summary.
- FR-9.7: On approval: update invoice status to Paid, set paidAt timestamp, create a completed transaction (source: invoice_payment), update portal metrics.
- FR-9.8: If invoice is already Paid, show "This invoice has already been paid" with receipt summary.
- FR-9.9: If invoice is Written Off, show "This invoice is no longer payable."
- FR-9.10: If invoice is Refunded, show "This invoice was refunded."
- FR-9.11: If invoice ID is invalid, show "Invoice not found."
- FR-9.12: Do not support partial payments, saved cards, customer login, or account creation.

### FR-10: Overdue Detection
- FR-10.1: An Outstanding invoice becomes Overdue when today's date exceeds the due date.
- FR-10.2: Overdue detection must be evaluated at render time (not via background job).
- FR-10.3: Overdue invoices appear with warning/red status throughout the app (list, dashboard, detail).

## Edge Cases & Error States

- **Invoice not found**: `/invoices/invalid-id` and `/pay/invalid-id` both show appropriate "Not found" messages.
- **Already paid invoice (hosted page)**: Customer visits `/pay/:id` for a paid invoice — show "This invoice has been paid" with receipt summary. No form shown.
- **Written-off invoice (hosted page)**: Show "This invoice is no longer payable. Please contact [merchant name]."
- **Refunded invoice (hosted page)**: Show "This invoice was refunded on [date]."
- **Overdue detection edge case**: Invoice due today is NOT overdue. Only past-due (dueDate < today) triggers overdue.
- **Due date before issue date**: Form validation prevents this — inline error: "Due date must be on or after issue date."
- **Send failure (Dev Controls)**: "Send Invoice" action shows error toast: "Failed to send invoice. Please try again." Invoice remains in Draft.
- **Payment page processing error (Dev Controls)**: After card submission delay, show: "Payment could not be processed. Please try again." Invoice remains Outstanding.
- **Empty invoice list**: "No invoices yet. Create your first invoice to get started."
- **All invoices paid (Attention section)**: Dashboard shows "All caught up — no overdue invoices!" 
- **Invoice with $0 tax**: When tax is disabled or rate is 0, tax line is hidden from display.
- **Hosted page offline (Dev Controls)**: Show "Unable to process payment — please check your connection and try again."
- **Double-submit on hosted page**: Disable pay button during processing.
- **Multiple rapid sends**: "Send Invoice" button disabled during the brief send simulation.
- **Reminder cooldown**: Show "Last reminder sent: [time]" — no enforced cooldown, but display discourages rapid re-sending.
- **Write-off confirmation**: Must be explicit — "This action cannot be undone. The invoice will be marked as written off."
- **Invoice refund with missing transaction**: If linked transaction is somehow missing, show error: "Could not process refund — linked payment not found."

## Non-Functional Requirements

- NFR-1: Invoice creation form must validate in real-time (due date must be ≥ issue date).
- NFR-2: The hosted payment page must be visually distinct from the merchant portal (no sidebar, different header).
- NFR-3: The hosted payment page must be mobile-friendly (many customers pay from phone).
- NFR-4: Email preview modals must be read-only (merchant cannot edit email content, only preview and confirm).

## Out of Scope

- Real email delivery
- Recurring invoices
- Scheduled sending
- Partial payments or installments
- Payment allocation
- Customer login or saved payment methods
- PDF invoice generation
- Multiple currency support
