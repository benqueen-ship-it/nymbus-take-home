# Design: Transaction Management & Refunds

## Component Architecture

```
TransactionList (page)
├── SearchInput
├── FilterBar
│   ├── DateRangePicker (start, end)
│   ├── StatusFilter (dropdown/chips)
│   ├── SourceFilter (dropdown)
│   └── ClearFiltersButton
├── TransactionSummary (count + total)
├── TransactionTable
│   └── TransactionRow (× n)
│       ├── StatusBadge
│       └── Link to detail
└── EmptyState (conditional)

TransactionDetail (page)
├── Breadcrumb (Transactions > TXN-XXXX)
├── StatusBadge (prominent)
├── CustomerSection
│   └── Link to /customers/:id
├── SaleDetailsCard
│   ├── Note, Source, Timestamp
│   └── LineItems (subtotal, tax, tip, total)
├── PaymentMethodCard
│   ├── CardBrandIcon
│   ├── MaskedCard
│   └── CardholderName
├── StatusTimeline
│   └── TimelineEntry (× n)
├── RefundInfoCard (if refunded)
│   ├── RefundID, RefundDate, Amount
│   └── Link to refund transaction
├── ChargebackInfoCard (if chargeback)
│   ├── Reason, DisputedAmount, Date
│   └── "No action available" notice
└── RefundButton (if status === 'completed')
    └── Opens RefundConfirmationModal

RefundConfirmationModal
├── TransactionSummary (ID, customer, amount)
├── Warning text
├── ConfirmButton (with loading state)
└── CancelButton
```

## Data Model

```typescript
interface Transaction {
  id: string;                    // txn_<id>
  customerId: string | null;     // null for anonymous/walk-in transactions
  type: 'payment' | 'refund';
  source: 'virtual_terminal' | 'invoice_payment';
  amount: number;                // subtotal
  taxAmount: number;
  tipAmount: number;
  total: number;
  status: 'completed' | 'pending' | 'declined' | 'refunded' | 'chargeback';
  paymentMethod: 'card';
  cardBrand: string;             // Visa, Mastercard, Amex, Discover
  maskedCard: string;            // •••• 1234
  cardholderName: string;
  note: string;
  createdAt: string;             // ISO 8601
  refundedAt?: string;           // ISO 8601
  refundId?: string;             // linked refund transaction ID
  linkedTransactionId?: string;  // for refund records, points to original
  chargebackReason?: string;
  chargebackAmount?: number;
  chargebackDate?: string;
}
```

## Refund Flow

```
User clicks "Refund Payment" on completed transaction
  ↓
RefundConfirmationModal opens
  Shows: TXN ID, customer, card, full amount
  ↓
User clicks "Confirm Refund"
  Button enters loading state, disabled
  ↓
Simulate 1–1.5s processing delay
  ↓
Dispatch two actions:
  1. ADD_TRANSACTION: new refund record
     { type: 'refund', status: 'completed', linkedTransactionId: originalId, ... }
  2. UPDATE_TRANSACTION: original transaction
     { status: 'refunded', refundedAt: now, refundId: newRefundId }
  ↓
Close modal, show success toast
Detail view updates to show refunded state + refund info card
```

### Refund Transaction Record
```typescript
{
  id: `txn_${generateId()}`,
  customerId: originalTransaction.customerId,
  type: 'refund',
  source: originalTransaction.source,
  amount: -originalTransaction.amount,   // negative
  taxAmount: -originalTransaction.taxAmount,
  tipAmount: -originalTransaction.tipAmount,
  total: -originalTransaction.total,
  status: 'completed',
  paymentMethod: 'card',
  cardBrand: originalTransaction.cardBrand,
  maskedCard: originalTransaction.maskedCard,
  cardholderName: originalTransaction.cardholderName,
  note: `Refund for ${originalTransaction.id}`,
  createdAt: new Date().toISOString(),
  linkedTransactionId: originalTransaction.id,
}
```

## Filter Logic

```typescript
function filterTransactions(
  transactions: Transaction[],
  filters: TransactionFilters
): Transaction[] {
  return transactions.filter(txn => {
    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const customer = getCustomerById(txn.customerId);
      const matchesSearch =
        txn.id.toLowerCase().includes(q) ||
        customer?.firstName.toLowerCase().includes(q) ||
        customer?.lastName.toLowerCase().includes(q) ||
        customer?.email.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }
    // Status
    if (filters.status && filters.status !== 'all' && txn.status !== filters.status) return false;
    // Source
    if (filters.source && filters.source !== 'all' && txn.source !== filters.source) return false;
    // Date range
    if (filters.startDate && txn.createdAt < filters.startDate) return false;
    if (filters.endDate && txn.createdAt > filters.endDate) return false;
    return true;
  });
}
```

## Status Timeline

Simple vertical timeline showing status transitions:
```
● Created — Aug 15, 2026 at 2:30 PM
● Completed — Aug 15, 2026 at 2:30 PM
● Refunded — Aug 18, 2026 at 11:45 AM
```

For most transactions, Created and Completed happen simultaneously (same timestamp). The timeline gives visual structure for refunded/chargeback cases.

## Responsive Layout

- **Desktop**: Full table with all columns
- **Tablet**: Hide transaction ID column, show only last 4 of masked card
- **Mobile**: Card-based list with key info (customer, amount, status, date) per card
