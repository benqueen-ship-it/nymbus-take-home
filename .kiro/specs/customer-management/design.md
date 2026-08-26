# Design: Customer Management

## Component Architecture

```
CustomerList (page)
├── SearchInput
├── CustomerTable
│   └── CustomerRow (× n)
│       └── StatusBadge
└── EmptyState (conditional)

CustomerDetail (page)
├── CustomerInfoCard
│   ├── StatusBadge
│   └── ActivateDeactivateButton
├── CustomerMetrics (total spend, invoice total)
├── RecentTransactions (list)
└── RecentInvoices (list)

CustomerForm (modal or section)
├── Input (firstName) *required
├── Input (lastName) *required  
├── Input (email) *required
├── Input (phone)
├── ValidationErrors
└── Button (Submit / Cancel)
```

## Data Model

```typescript
interface Customer {
  id: string;              // cust_<uuid> or cust_seed_XXX
  firstName: string;
  lastName: string;
  email: string;           // unique, lowercase
  phone: string;           // optional, free-form
  status: 'active' | 'inactive';
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601
}
```

### Computed fields (derived in components, not stored):
- `fullName`: `${firstName} ${lastName}`
- `totalSpend`: sum of transactions where customerId matches and status is 'completed'
- `lastActivityDate`: most recent transaction or invoice date for this customer
- `transactionCount`: count of transactions for this customer
- `invoiceCount`: count of invoices for this customer

## State Actions

```typescript
type CustomerActions =
  | { type: 'ADD_CUSTOMER'; payload: Customer }
  | { type: 'UPDATE_CUSTOMER'; payload: { id: string; updates: Partial<Customer> } };
```

## Email Uniqueness Validation

Validation logic runs on blur and on submit:
```typescript
function isEmailUnique(email: string, excludeId?: string): boolean {
  return !customers.some(
    c => c.email.toLowerCase() === email.toLowerCase() && c.id !== excludeId
  );
}
```

## Search Implementation

Client-side filter on the full customer list:
```typescript
function filterCustomers(customers: Customer[], query: string): Customer[] {
  const q = query.toLowerCase().trim();
  if (!q) return customers;
  return customers.filter(c =>
    c.firstName.toLowerCase().includes(q) ||
    c.lastName.toLowerCase().includes(q) ||
    c.email.toLowerCase().includes(q) ||
    c.phone.includes(q)
  );
}
```

## Customer Selector Component

A reusable `CustomerSelector` component used by VT and Invoices:
```typescript
interface CustomerSelectorProps {
  value: string | null;        // selected customer ID
  onChange: (id: string) => void;
  onCreateNew: () => void;     // opens quick-create modal
}
```

Renders as a searchable dropdown/combobox with:
- Type-ahead filtering
- Display: "FirstName LastName (email)"
- "+ New Customer" option at bottom that triggers onCreateNew

## Responsive Considerations

- **Desktop**: Full table with all columns visible
- **Tablet**: Hide phone column, reduce padding
- **Mobile**: Switch to card-based list layout (name + email + status per card)

## Navigation & Links

- Customer rows in the list link to `/customers/:id`
- "Transactions" section in detail links individual items to `/transactions/:txnId`
- "Invoices" section in detail links individual items to `/invoices/:invId`
- Breadcrumb: Customers > Customer Name
