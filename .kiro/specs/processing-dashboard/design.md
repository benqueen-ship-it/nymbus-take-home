# Design: Processing & Dashboard

## Component Architecture

```
Dashboard (page)
├── SummaryCards (grid)
│   ├── MetricCard (Today's Sales)
│   ├── MetricCard (Outstanding Invoices)
│   ├── MetricCard (Overdue Invoices)
│   └── MetricCard (Next Deposit)
├── RecentActivity
│   └── ActivityItem (× 10)
├── AttentionRequired
│   └── OverdueInvoiceItem (× n)
└── ProcessingSummary
    ├── Gross Volume
    ├── Estimated Fees
    └── Net Deposits

Processing (page)
├── MonthlySummaryCard
│   ├── GrossVolume
│   ├── Refunds
│   ├── Fees
│   ├── Chargebacks
│   └── NetDeposits
├── ProcessingStatements
│   ├── StatementRow (× 2–3)
│   │   └── DownloadButton
│   └── (seeded static data)
└── Deposits
    ├── SettlementAccountHeader (masked: •••• 4821)
    ├── DepositTable
    │   └── DepositRow (× 5–8)
    └── DepositDetail (drawer or sub-page)
        ├── DepositSummary
        └── BatchBreakdown (3–5 mock transactions)
```

## Dashboard Metrics Computation

All dashboard metrics are derived from global state at render time:

```typescript
interface DashboardMetrics {
  todaysSales: { amount: number; count: number };
  outstandingInvoices: { amount: number; count: number };
  overdueInvoices: { amount: number; count: number };
  nextDeposit: { amount: number; date: string };
  processingSummary: {
    grossVolume: number;
    estimatedFees: number;
    netDeposits: number;
  };
}

function computeDashboardMetrics(state: AppState): DashboardMetrics {
  const today = new Date().toISOString().split('T')[0];
  const startOfMonth = `${today.slice(0, 7)}-01`;

  // Today's Sales: sum of completed payment transactions from today
  const todaysTransactions = state.transactions.filter(
    t => t.type === 'payment' && t.status === 'completed' && t.createdAt.startsWith(today)
  );
  const todaysSales = {
    amount: todaysTransactions.reduce((sum, t) => sum + t.total, 0),
    count: todaysTransactions.length,
  };

  // Outstanding Invoices (not overdue)
  const outstanding = state.invoices.filter(
    i => i.status === 'outstanding' && i.dueDate >= today
  );
  const outstandingInvoices = {
    amount: outstanding.reduce((sum, i) => sum + i.total, 0),
    count: outstanding.length,
  };

  // Overdue Invoices
  const overdue = state.invoices.filter(
    i => i.status === 'outstanding' && i.dueDate < today
  );
  const overdueInvoices = {
    amount: overdue.reduce((sum, i) => sum + i.total, 0),
    count: overdue.length,
  };

  // Next Deposit (mock - hardcoded or derived)
  const nextDeposit = {
    amount: todaysSales.amount * 0.971 - todaysTransactions.length * 0.30,
    date: addBusinessDays(today, 2),  // T+2 settlement
  };

  // Processing Summary (current month)
  const monthTransactions = state.transactions.filter(
    t => t.type === 'payment' && t.status === 'completed' && t.createdAt >= startOfMonth
  );
  const grossVolume = monthTransactions.reduce((sum, t) => sum + t.total, 0);
  const estimatedFees = grossVolume * 0.029 + monthTransactions.length * 0.30;

  return {
    todaysSales,
    outstandingInvoices,
    overdueInvoices,
    nextDeposit: nextDeposit.amount > 0 ? nextDeposit : { amount: 0, date: '' },
    processingSummary: {
      grossVolume,
      estimatedFees: Math.round(estimatedFees * 100) / 100,
      netDeposits: Math.round((grossVolume - estimatedFees) * 100) / 100,
    },
  };
}
```

## Seeded Processing Data

### Statements (static, seeded)
```typescript
const seedStatements = [
  { month: 'July 2026', grossVolume: 28450.00, fees: 854.30, net: 27595.70 },
  { month: 'June 2026', grossVolume: 31200.00, fees: 935.10, net: 30264.90 },
  { month: 'May 2026', grossVolume: 25800.00, fees: 778.50, net: 25021.50 },
];
```

### Deposits (static, seeded)
```typescript
interface Deposit {
  id: string;
  date: string;         // YYYY-MM-DD
  status: 'settled' | 'pending' | 'in_transit';
  grossAmount: number;
  fees: number;
  adjustments: number;  // chargebacks, refund costs
  netAmount: number;
  batchTransactions: string[];  // mock transaction IDs
}
```

6–8 deposits spanning the last 30 days with appropriate status distribution:
- Most recent: pending or in_transit
- Older: settled

## Statement Download

"Download Statement" triggers:
```typescript
function downloadStatement(statement: Statement) {
  const content = `Processing Statement - ${statement.month}\n\nGross Volume: $${statement.grossVolume}\nFees: $${statement.fees}\nNet: $${statement.net}`;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `statement-${statement.month.replace(' ', '-')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  // Show success toast
}
```

## Deposit Detail View

Implemented as a slide-out drawer or expandable section:
```
┌─────────────────────────────────────────┐
│  Deposit Detail                         │
│  Date: Aug 20, 2026                     │
│  Status: Settled ✓                      │
│                                         │
│  Gross:        $4,850.00                │
│  Fees:         -$145.22                 │
│  Adjustments:  -$50.00                  │
│  Net Deposit:  $4,654.78                │
│                                         │
│  ── Batch Transactions ──               │
│  TXN-001  Jane Smith   $250.00  ✓       │
│  TXN-002  John Doe     $1,200.00  ✓     │
│  TXN-003  Acme Corp    $3,400.00  ✓     │
│                                         │
│  Settlement Account: •••• 4821          │
└─────────────────────────────────────────┘
```

## Dashboard Layout (Responsive Grid)

```
Desktop (4 columns):
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│Today │ │Outstd│ │Overdu│ │Next  │
│Sales │ │Inv   │ │Inv   │ │Depo  │
└──────┘ └──────┘ └──────┘ └──────┘
┌──────────────────┐ ┌──────────────┐
│ Recent Activity  │ │  Attention   │
│ (transaction     │ │  Required    │
│  list)           │ │  (overdue)   │
└──────────────────┘ └──────────────┘
┌─────────────────────────────────────┐
│  Processing Summary (compact)       │
└─────────────────────────────────────┘

Tablet (2 columns):
Summary cards → 2×2 grid
Activity + Attention → stacked

Mobile (1 column):
Everything stacks vertically
```

## Key Design Decision: Real vs. Seeded Data

- **Dashboard metrics** (FR-1 through FR-4): Computed from real app state. These update live as the user interacts with VT, invoicing, and refunds.
- **Processing page** (FR-5 through FR-7): Mix of computed current-month data and seeded historical data. The current month summary uses real transactions; statements and deposits are entirely seeded mock data.

This ensures the demo journey works end-to-end (merchant makes payment → dashboard updates) while still showing a populated processing section without needing weeks of historical activity.
