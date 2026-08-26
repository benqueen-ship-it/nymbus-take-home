# Design: Invoicing & Hosted Payment

## Component Architecture

```
InvoiceList (page)
├── InvoiceMetrics
│   ├── MetricCard (Outstanding Amount)
│   ├── MetricCard (Overdue Amount)
│   ├── MetricCard (Paid This Month)
│   └── MetricCard (Invoice Count)
├── SearchInput
├── FilterBar (status, customer, due date range)
├── InvoiceTable
│   └── InvoiceRow (× n) — overdue rows highlighted
└── EmptyState

InvoiceDetail (page)
├── Breadcrumb
├── InvoiceHeader (number + status badge)
├── CustomerCard (name, email, link)
├── InvoiceDetailsCard (description, dates, amounts)
├── PaymentInfo (if paid — transaction link)
├── ActionButtons (Send, Write Off, Refund, Remind)
└── ActivityTimeline

InvoiceForm (modal or page)
├── CustomerSelector
├── DescriptionInput
├── AmountInput
├── TaxToggle + calculated display
├── IssueDatePicker (default: today)
├── DueDatePicker (required, must be ≥ issue date)
├── OrderSummary (subtotal, tax, total)
└── Actions: Save as Draft / Save & Send

EmailPreviewModal
├── EmailHeader (merchant logo + name)
├── EmailBody (varies by template type)
│   ├── NewInvoice template
│   ├── InvoicePaid template
│   ├── InvoiceOverdue template
│   └── InvoiceRefunded template
├── CTA Button preview
└── SendButton / Close

HostedPaymentPage (standalone, no shell)
├── MerchantBrandHeader (logo + name + colors)
├── InvoiceSummary (number, description, amount, due date)
├── CardPaymentForm (similar to VT but simpler)
├── ProcessingState
├── PaidConfirmation (on success)
└── StatusMessage (already paid / written off / invalid)
```

## Data Model

```typescript
interface Invoice {
  id: string;                    // inv_<id>
  customerId: string;
  invoiceNumber: string;         // INV-001, INV-002
  description: string;
  amount: number;                // subtotal
  taxAmount: number;
  total: number;
  status: 'draft' | 'outstanding' | 'overdue' | 'paid' | 'written_off' | 'refunded';
  issueDate: string;             // YYYY-MM-DD
  dueDate: string;               // YYYY-MM-DD
  sentAt?: string;               // ISO 8601
  paidAt?: string;               // ISO 8601
  refundedAt?: string;           // ISO 8601
  writtenOffAt?: string;         // ISO 8601
  lastReminderSentAt?: string;   // ISO 8601
  linkedTransactionId?: string;  // transaction created on payment
}
```

## Invoice Number Generation

```typescript
function generateInvoiceNumber(existingInvoices: Invoice[]): string {
  const maxNumber = existingInvoices.reduce((max, inv) => {
    const num = parseInt(inv.invoiceNumber.replace('INV-', ''), 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
  return `INV-${String(maxNumber + 1).padStart(3, '0')}`;
}
```

## Overdue Detection Logic

Evaluated at render time (not stored as status transition):
```typescript
function getEffectiveStatus(invoice: Invoice): Invoice['status'] {
  if (invoice.status === 'outstanding') {
    const today = new Date().toISOString().split('T')[0];
    if (invoice.dueDate < today) return 'overdue';
  }
  return invoice.status;
}
```

Note: The actual status field in state remains 'outstanding' — the 'overdue' designation is derived. This avoids needing background jobs.

## Invoice Payment Flow (Hosted Page)

```
Customer visits /pay/:invoiceId
  ↓
Load invoice from state
  ↓
┌─ Invoice is Paid → Show "Already Paid" + receipt
├─ Invoice is Written Off → Show "No longer payable"
├─ Invoice is Refunded → Show "Was refunded"
├─ Invoice not found → Show "Not found"
└─ Invoice is Outstanding/Overdue → Show payment form
  ↓
Customer fills card form + submits
  ↓
Simulate 1.5–2s processing
  ↓
On success:
  - Dispatch UPDATE_INVOICE: status → 'paid', paidAt → now, linkedTransactionId
  - Dispatch ADD_TRANSACTION: invoice_payment transaction
  - Show "Payment Successful" confirmation
```

## Email Template Data

Each template receives:
```typescript
interface EmailTemplateData {
  merchantName: string;
  merchantLogo: string;
  primaryColor: string;
  secondaryColor: string;
  customerName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  paymentLink: string;   // /pay/:invoiceId
}
```

Templates render as styled HTML within a modal preview. The "Send" button simply dispatches the state update and closes the modal.

## State Actions

```typescript
type InvoiceActions =
  | { type: 'ADD_INVOICE'; payload: Invoice }
  | { type: 'UPDATE_INVOICE'; payload: { id: string; updates: Partial<Invoice> } };
```

## Metrics Computation

```typescript
function computeInvoiceMetrics(invoices: Invoice[]) {
  const now = new Date().toISOString().split('T')[0];
  const startOfMonth = `${now.slice(0, 7)}-01`;

  return {
    outstandingAmount: invoices
      .filter(i => i.status === 'outstanding')
      .reduce((sum, i) => sum + i.total, 0),
    overdueAmount: invoices
      .filter(i => i.status === 'outstanding' && i.dueDate < now)
      .reduce((sum, i) => sum + i.total, 0),
    paidThisMonth: invoices
      .filter(i => i.status === 'paid' && i.paidAt && i.paidAt >= startOfMonth)
      .reduce((sum, i) => sum + i.total, 0),
    totalCount: invoices.length,
  };
}
```

## Hosted Payment Page Layout

```
┌────────────────────────────────────────┐
│  [Logo]  Merchant Display Name         │ ← branded header
│  Primary color background              │
├────────────────────────────────────────┤
│                                        │
│  Invoice #INV-007                      │
│  Description text here                 │
│                                        │
│  Amount Due:  $1,250.00                │
│  Due Date:    Sept 15, 2026            │
│  Customer:    Jane Smith               │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  Card Payment                    │  │
│  │  ⚠ Test mode — no real charges  │  │
│  │                                  │  │
│  │  Cardholder Name  [________]     │  │
│  │  Card Number      [________]     │  │
│  │  Expiry    CVV    [__] [__]      │  │
│  │                                  │  │
│  │  [      Pay $1,250.00      ]     │  │
│  └──────────────────────────────────┘  │
│                                        │
│  Powered by [Merchant Name]            │
└────────────────────────────────────────┘
```

## Responsive Considerations

- Invoice list: table on desktop, cards on mobile
- Email preview modal: full-screen on mobile
- Hosted payment page: designed mobile-first (single column, large touch targets)
- Invoice form: single column on all breakpoints
