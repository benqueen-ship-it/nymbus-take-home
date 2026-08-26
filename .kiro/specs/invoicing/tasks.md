# Tasks: Invoicing & Hosted Payment

## Task 1: Invoice List Page & Metrics
- [ ] Create InvoiceList page component at pages/Invoices.tsx
- [ ] Build metrics bar: Outstanding Amount, Overdue Amount, Paid This Month, Invoice Count
- [ ] Compute metrics from state using getEffectiveStatus for overdue detection
- [ ] Build invoice table with columns: Number, Customer, Amount, Status, Due Date, Issued
- [ ] Style overdue rows with warning highlight (light red background or red left border)
- [ ] Implement default sort: overdue first, then by due date ascending
- [ ] Add search input (invoice number, customer name, email)
- [ ] Add filters: status dropdown, customer dropdown, due date range, amount range
- [ ] Enforce filter validation: date "To" ≥ "From", no future dates, auto-clear on conflict; amount Max ≥ Min, auto-clear on conflict; inline error messages
- [ ] Add "New Invoice" button in header

## Task 2: Invoice Creation Form
- [ ] Create InvoiceForm component (modal or full page)
- [ ] Integrate CustomerSelector
- [ ] Support pre-selected and locked customer mode (when opened from Customer Detail page)
- [ ] Add description textarea (required)
- [ ] Add amount input (required, > $0)
- [ ] Add tax toggle that applies merchant tax rate
- [ ] Show calculated subtotal, tax, total
- [ ] Add issue date picker (default: today)
- [ ] Add due date picker (required, must be ≥ issue date)
- [ ] Auto-generate invoice number (INV-XXX, incrementing)
- [ ] Add save options: "Save as Draft" and "Save & Send"
- [ ] Validate all required fields before save
- [ ] On save: dispatch ADD_INVOICE, navigate to invoice detail

## Task 3: Invoice Detail Page
- [ ] Create InvoiceDetail page at pages/InvoiceDetail.tsx
- [ ] Show invoice number, status badge (prominent), and customer info
- [ ] Display description, issue date, due date, sent date, amount breakdown
- [ ] Show linked transaction if Paid (clickable link to /transactions/:id)
- [ ] Show action buttons based on status:
  - Draft: "Send Invoice", "Edit"
  - Outstanding: "Send Reminder" (if overdue), "Write Off"
  - Overdue: "Send Reminder", "Write Off"
  - Paid: "Refund Payment"
  - Written Off / Refunded: no actions
- [ ] Add breadcrumb: Invoices > INV-XXX

## Task 4: Send Invoice Flow
- [ ] Implement "Send Invoice" button for Draft invoices
- [ ] Open EmailPreviewModal with "New Invoice" template
- [ ] On confirm: dispatch UPDATE_INVOICE (status → outstanding, sentAt → now)
- [ ] Show success toast: "Invoice sent to [email]"
- [ ] Implement "Re-send" for Outstanding invoices (updates sentAt)

## Task 5: Write Off Flow
- [ ] Add "Write Off" button for Outstanding/Overdue invoices
- [ ] Show confirmation modal with warning text
- [ ] On confirm: dispatch UPDATE_INVOICE (status → written_off, writtenOffAt → now)
- [ ] Show success toast, update detail view
- [ ] Remove action buttons after write-off

## Task 6: Invoice Refund Flow
- [ ] Add "Refund Payment" button for Paid invoices
- [ ] Show confirmation modal with invoice and refund amount
- [ ] On confirm: simulate processing (1–1.5s)
- [ ] Create linked refund transaction (ADD_TRANSACTION)
- [ ] Update original payment transaction to 'refunded' (UPDATE_TRANSACTION)
- [ ] Update invoice status to 'refunded' (UPDATE_INVOICE, refundedAt → now)
- [ ] Show success toast

## Task 7: Send Reminder Flow
- [ ] Add "Send Reminder" button for Overdue invoices
- [ ] Open EmailPreviewModal with "Invoice Overdue" template
- [ ] On confirm: dispatch UPDATE_INVOICE (lastReminderSentAt → now)
- [ ] Show success toast
- [ ] Display "Last reminder sent: [date]" in detail view

## Task 8: Email Preview Modal
- [ ] Create EmailPreviewModal component with template system
- [ ] Build "New Invoice" template: merchant header, customer name, amount, due date, CTA
- [ ] Build "Invoice Paid" template: confirmation, payment summary
- [ ] Build "Invoice Overdue" template: reminder, amount, CTA
- [ ] Build "Invoice Refunded" template: refund notification
- [ ] Apply merchant branding (logo, colors, name) dynamically
- [ ] Add "Send" button at bottom of modal (triggers parent's onSend callback)
- [ ] Add "Cancel" to close without sending
- [ ] Style as realistic email rendering (white card on gray background)

## Task 9: Hosted Invoice Payment Page
- [ ] Create HostedPaymentPage component at pages/HostedPayment.tsx
- [ ] Set up route /pay/:invoiceId outside AppShell
- [ ] Load invoice by ID from global state
- [ ] Handle invalid states: not found, already paid, written off, refunded
- [ ] Apply merchant branding to page header (logo, name, primary color)
- [ ] Display invoice summary: number, description, amount, due date, customer
- [ ] Build simplified card payment form (cardholder, number, exp, CVV)
- [ ] Add clear prototype messaging: "Test mode — no real payments"
- [ ] Implement form validation (same rules as VT)
- [ ] On submit: simulate 1.5–2s processing with spinner

## Task 10: Hosted Payment Completion
- [ ] On approval: dispatch UPDATE_INVOICE (status → paid, paidAt, linkedTransactionId)
- [ ] On approval: dispatch ADD_TRANSACTION (source: invoice_payment)
- [ ] Show branded "Payment Successful" confirmation with receipt summary
- [ ] Receipt shows: merchant name, invoice number, amount paid, date, masked card
- [ ] Add "Return" or "Done" message (nowhere to navigate — standalone page)
- [ ] Ensure dashboard and invoice list reflect the payment when merchant navigates back

## Task 11: Overdue Detection Utility
- [ ] Create getEffectiveStatus utility function
- [ ] Apply it in invoice list rendering, metrics computation, and detail view
- [ ] Ensure status badge shows "Overdue" (red) for outstanding invoices past due date
- [ ] Use this utility consistently everywhere invoices are displayed
