# Requirements: Processing & Dashboard

## Problem Statement

A merchant needs an at-a-glance view of their business health: today's sales, outstanding invoices, recent activity, and upcoming deposits. They also need a processing overview showing volume, fees, and settlements — the financial "back office" of their payment operations. Without these views, merchants must mentally aggregate data from multiple screens or export to spreadsheets.

## User Persona

**Merchant Administrator** — checks the dashboard daily to see how business is tracking. Periodically reviews processing statements and deposit records for bookkeeping and reconciliation.

## Functional Requirements

### FR-1: Dashboard Summary Cards
- FR-1.1: Display a "Today's Sales" card showing total completed payment amounts from today.
- FR-1.2: Display an "Outstanding Invoices" card showing count and total of outstanding (not overdue) invoices.
- FR-1.3: Display an "Overdue Invoices" card showing count and total of overdue invoices (visually urgent/red).
- FR-1.4: Display a "Next Deposit" card showing a simulated upcoming deposit amount and date (mock data).
- FR-1.5: All summary cards must update dynamically when transactions, refunds, or invoice payments occur.

### FR-2: Recent Activity
- FR-2.1: Display a "Recent Activity" list showing the last 10 transactions (all types) in chronological order.
- FR-2.2: Each activity item must show: time, description (e.g., "Payment from Jane Smith"), amount, and status badge.
- FR-2.3: Items must link to their transaction detail page.
- FR-2.4: If no activity exists, show an appropriate empty state.

### FR-3: Invoices Requiring Attention
- FR-3.1: Show an "Attention Required" section listing overdue invoices.
- FR-3.2: Each item must show: invoice number, customer name, amount, days overdue.
- FR-3.3: Items must link to the invoice detail page.
- FR-3.4: If no overdue invoices exist, hide this section or show "All caught up" message.

### FR-4: Processing Summary (Dashboard)
- FR-4.1: Show a compact "Processing" card on the dashboard with: current-month gross volume, estimated fees (2.9% + $0.30 per transaction), and net deposits.
- FR-4.2: Gross volume is calculated from all completed transactions in the current month.
- FR-4.3: Fees are computed as (2.9% × volume) + ($0.30 × transaction count).
- FR-4.4: Net = Gross - Fees.

### FR-5: Processing Page — Monthly Summary
- FR-5.1: The Processing page at `/processing` must show a monthly processing summary.
- FR-5.2: Display: gross volume, refunds total, processing fees, chargebacks total, and net deposits for the current month.
- FR-5.3: Use a clear card or table layout with labeled values.
- FR-5.4: This section combines real local data (transactions created in the app) with seeded historical data.

### FR-6: Processing Statements
- FR-6.1: Display a "Processing Statements" list with 2–3 sample monthly statements (seeded, not dynamically generated).
- FR-6.2: Each statement shows: month/year, gross volume, fees, and net amount.
- FR-6.3: Each statement has a "Download Statement" action.
- FR-6.4: The download action must show a success toast or generate a simple static text/CSV client-side document. It must not connect to a real service.

### FR-7: Processing Deposits
- FR-7.1: Display a "Deposits" list with 5–8 seeded deposit entries.
- FR-7.2: Each deposit shows: deposit date, settlement status (Settled / Pending / In Transit), gross amount, fees, adjustments, and net deposited amount.
- FR-7.3: Each deposit must have a clickable detail action (drawer or sub-page).
- FR-7.4: Deposit detail must show a mock batch breakdown: list of 3–5 transactions grouped in that deposit.
- FR-7.5: Show a masked settlement bank account (e.g., "•••• 4821") in the deposits section header.
- FR-7.6: Any date range or amount range filters on processing pages must enforce the same validation rules: "To" ≥ "From", no future dates, auto-clear on conflict; Max ≥ Min, auto-clear on conflict; inline error messages for invalid states.

### FR-8: Dashboard Responsiveness
- FR-8.1: Dashboard must adapt to tablet and mobile widths.
- FR-8.2: Summary cards must reflow (4-column → 2-column → 1-column).
- FR-8.3: Sections must stack vertically on narrow viewports.

## Edge Cases & Error States

- **Empty dashboard (Dev Controls or new merchant)**: All metric cards show $0.00 / 0 count. Recent activity shows "No recent activity." Attention section shows "All caught up!" Processing summary shows $0 across the board.
- **No transactions today**: "Today's Sales" card shows $0.00 and "0 transactions" — not hidden.
- **Negative next deposit**: If refunds exceed sales, Next Deposit shows $0.00 (floor at zero, don't show negative).
- **No overdue invoices**: Attention section shows positive "All caught up" message instead of being hidden entirely.
- **Very high transaction count in month**: Processing summary should format large numbers correctly ($100,000+ with commas).
- **Statement download failure (Dev Controls)**: Toast: "Could not generate statement. Please try again."
- **Deposit detail for missing data**: If batch transaction references don't resolve, show "Transaction details unavailable" placeholder.
- **Dashboard after reset**: Immediately after "Reset Demo Data," dashboard repopulates with seed data metrics.
- **Processing page with no current-month data**: Show $0.00 for all computed fields. Seeded historical statements/deposits still display.
- **Rapid navigation**: Dashboard metrics should not flicker or show stale data when navigating between pages quickly.
- **Force Loading (Dev Controls)**: Dashboard shows skeleton cards and loading placeholders.
- **Offline Mode (Dev Controls)**: Dashboard still renders (all data is local) but shows subtle "Offline" indicator.

## Non-Functional Requirements

- NFR-1: Dashboard must render within 500ms of navigation (no loading states for locally computed data).
- NFR-2: Processing page is read-only — no actions modify processing data.
- NFR-3: Seeded processing/deposit data must look realistic (reasonable amounts, consistent dates, proper status distribution).

## Out of Scope

- Real settlement logic or reconciliation
- Processor data ingestion
- Bank/DDA connectivity
- Accounting integrations
- Real statement generation or PDF
- Custom date range selection for processing summary
- Fee rate configuration (hardcoded at 2.9% + $0.30)
- Multi-month dashboard analytics or charts
