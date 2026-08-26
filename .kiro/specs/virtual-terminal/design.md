# Design: Virtual Terminal & Payment Flow

## Component Architecture

```
VirtualTerminal (page)
├── PaymentForm
│   ├── CustomerSelector
│   ├── AmountInput
│   ├── NoteInput
│   ├── TaxToggle + TaxSummary
│   ├── TipInput
│   ├── OrderSummary (read-only calculated)
│   ├── CardEntrySection
│   │   ├── CardholderNameInput
│   │   ├── CardNumberInput (formatted)
│   │   ├── ExpirationInput (MM/YY)
│   │   └── CVVInput (masked)
│   └── SubmitButton
├── ProcessingOverlay (conditional)
│   └── Spinner + "Authorizing payment..."
└── DeclineMessage (conditional)

PaymentConfirmation (page or modal)
├── SuccessIcon + "Payment Approved"
├── ReceiptDetails
│   ├── MerchantName
│   ├── TransactionID
│   ├── DateTime
│   ├── CustomerName
│   ├── Note
│   ├── CardInfo (masked + brand icon)
│   ├── LineItems (subtotal, tax, tip, total)
│   └── StatusBadge (Completed)
├── PrintReceiptButton
├── EmailReceiptButton
└── NewPaymentButton
```

## Payment Flow State Machine

```
          ┌─────────┐
          │  IDLE   │ (form visible, editable)
          └────┬────┘
               │ submit (valid)
          ┌────▼────┐
          │PROCESSING│ (1.5s delay, overlay shown)
          └────┬────┘
               │
        ┌──────┴──────┐
        │             │
   ┌────▼────┐  ┌────▼────┐
   │ APPROVED│  │ DECLINED│
   └────┬────┘  └────┬────┘
        │             │
   Navigate to    Show error,
   Confirmation   keep form
```

Implementation via `useState`:
```typescript
type PaymentState = 'idle' | 'processing' | 'approved' | 'declined';
const [paymentState, setPaymentState] = useState<PaymentState>('idle');
```

## Card Number Handling

### Input Formatting
```typescript
function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}
```

### Brand Detection
```typescript
function detectCardBrand(number: string): string {
  const first = number.charAt(0);
  switch (first) {
    case '4': return 'Visa';
    case '5': return 'Mastercard';
    case '3': return 'Amex';
    case '6': return 'Discover';
    default: return 'Unknown';
  }
}
```

### Masking (for storage)
```typescript
function maskCard(number: string): string {
  const digits = number.replace(/\D/g, '');
  return `•••• ${digits.slice(-4)}`;
}
```

### Decline Detection
```typescript
function shouldDecline(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  return digits.endsWith('0000');
}
```

## Order Summary Calculation

```typescript
interface OrderSummary {
  subtotal: number;      // amount entered
  taxRate: number;       // merchant config rate or 0
  taxAmount: number;     // subtotal * taxRate
  tip: number;           // tip entered or 0
  total: number;         // subtotal + taxAmount + tip
}

function calculateOrder(amount: number, taxEnabled: boolean, taxRate: number, tip: number): OrderSummary {
  const subtotal = amount;
  const taxAmount = taxEnabled ? Math.round(subtotal * taxRate * 100) / 100 : 0;
  const total = subtotal + taxAmount + tip;
  return { subtotal, taxRate: taxEnabled ? taxRate : 0, taxAmount, tip, total };
}
```

## Transaction Record Creation

On approval, dispatch:
```typescript
{
  type: 'ADD_TRANSACTION',
  payload: {
    id: `txn_${generateId()}`,
    customerId: selectedCustomerId || null,  // null for anonymous/walk-in transactions
    type: 'payment',
    amount: orderSummary.subtotal,
    taxAmount: orderSummary.taxAmount,
    tipAmount: orderSummary.tip,
    total: orderSummary.total,
    status: 'completed',
    paymentMethod: 'card',
    cardBrand: detectCardBrand(cardNumber),
    maskedCard: maskCard(cardNumber),
    cardholderName: cardholderName,
    note: saleNote,
    createdAt: new Date().toISOString(),
    source: 'virtual_terminal',
  }
}
```

## Print Receipt Layout

Use `@media print` CSS to:
- Hide sidebar, navigation, and action buttons
- Show only the receipt content
- Set appropriate page margins
- Use monochrome-friendly styling
- Include merchant name as header

## Security Considerations (Prototype)

Even though this is a prototype:
- Card number and CVV are held only in component local state (useState)
- They are never written to the global AppState or localStorage
- On form reset or navigation away, they are garbage collected
- The only card data persisted is: masked last 4, cardholder name, detected brand

## Responsive Layout

```
Desktop (≥768px):
┌──────────────────────────────────────────────┐
│  Payment Form (left 60%)  │  Order Summary   │
│                           │  (right 40%)     │
│  Customer Selector        │  Subtotal: $X    │
│  Amount                   │  Tax: $X         │
│  Note                     │  Tip: $X         │
│  Tax Toggle               │  ─────────────   │
│  Tip                      │  Total: $X       │
│  ──── Card Details ────   │                  │
│  Name / Number            │                  │
│  Exp / CVV                │                  │
│  [Process Payment]        │                  │
└──────────────────────────────────────────────┘

Mobile (<768px):
Everything stacks vertically, order summary at top (sticky) or bottom.
```
