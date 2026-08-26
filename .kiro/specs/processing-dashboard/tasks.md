# Tasks: Processing & Dashboard

## Task 1: Dashboard Page Layout
- [ ] Create Dashboard page component at pages/Dashboard.tsx
- [ ] Build responsive grid layout for summary cards (4-col → 2-col → 1-col)
- [ ] Create MetricCard component (reusable) with: label, value, optional sub-label, icon, and color accent
- [ ] Implement two-column layout below cards: left (Recent Activity), right (Attention Required)
- [ ] Add Processing Summary section at bottom

## Task 2: Dashboard Metrics Computation
- [ ] Create useDashboardMetrics custom hook
- [ ] Compute Today's Sales from state (completed payment transactions from today)
- [ ] Compute Outstanding Invoices count + amount (outstanding, not overdue)
- [ ] Compute Overdue Invoices count + amount (outstanding + past due date)
- [ ] Compute Next Deposit (mock: today's sales × 0.971 - fees, T+2 date)
- [ ] Compute Processing Summary: gross volume (month), fees (2.9% + $0.30/txn), net
- [ ] Memoize computation to avoid recalculating on every render

## Task 3: Summary Cards
- [ ] Build "Today's Sales" card — dollar amount + transaction count, green accent
- [ ] Build "Outstanding Invoices" card — dollar amount + count, blue accent
- [ ] Build "Overdue Invoices" card — dollar amount + count, red/warning accent
- [ ] Build "Next Deposit" card — dollar amount + expected date, neutral accent
- [ ] Verify all cards update when user creates transactions, refunds, or pays invoices

## Task 4: Recent Activity List
- [ ] Build RecentActivity component showing last 10 transactions
- [ ] Format each item: relative time, description (e.g., "Payment from Jane Smith"), amount, status badge
- [ ] Make items clickable → navigate to /transactions/:id
- [ ] Build empty state: "No recent activity"
- [ ] Include refund transactions in activity (show as negative amounts)

## Task 5: Attention Required Section
- [ ] Build AttentionRequired component
- [ ] List overdue invoices: invoice number, customer, amount, days overdue
- [ ] Make items clickable → navigate to /invoices/:id
- [ ] Compute days overdue from dueDate vs today
- [ ] Show "All caught up!" message when no overdue invoices exist
- [ ] Limit to 5 items with "View all overdue" link if more exist

## Task 6: Dashboard Processing Summary
- [ ] Build compact ProcessingSummary card for dashboard
- [ ] Show: gross volume, estimated fees, net deposits for current month
- [ ] Format as clean three-column layout or stacked on mobile
- [ ] Link "View Processing" to /processing page

## Task 7: Processing Page — Monthly Summary
- [ ] Create Processing page component at pages/Processing.tsx
- [ ] Build CurrentMonthSummary card with: gross volume, refunds, fees, chargebacks, net
- [ ] Compute gross volume from all completed payment transactions this month
- [ ] Compute refunds from all completed refund transactions this month
- [ ] Compute fees: (2.9% × gross) + ($0.30 × payment count)
- [ ] Pull chargeback amount from any chargeback transactions this month
- [ ] Net = gross - refunds - fees - chargebacks

## Task 8: Processing Statements
- [ ] Create seeded statements data (3 months: May, June, July 2026)
- [ ] Build StatementsList component with table: Month, Gross, Fees, Net, Download
- [ ] Implement downloadStatement function (generates client-side text/CSV blob)
- [ ] Trigger download via dynamic anchor element
- [ ] Show success toast: "Statement downloaded"

## Task 9: Processing Deposits
- [ ] Create seeded deposits data (6–8 entries over last 30 days)
- [ ] Build DepositsTable with columns: Date, Status, Gross, Fees, Adjustments, Net
- [ ] Use StatusBadge for deposit status (Settled=green, In Transit=blue, Pending=yellow)
- [ ] Show masked settlement account header: "Settlement Account: •••• 4821"
- [ ] Make rows clickable to open deposit detail

## Task 10: Deposit Detail Drawer/View
- [ ] Create DepositDetail drawer or expandable section
- [ ] Show deposit summary: date, status, gross, fees, adjustments, net
- [ ] Show "Batch Breakdown" with 3–5 mock transactions per deposit
- [ ] Each batch item: transaction snippet (ID, customer, amount)
- [ ] Add close/collapse action

## Task 11: Seeded Processing Data
- [ ] Create seed data for 3 processing statements with realistic numbers
- [ ] Create seed data for 6–8 deposits with realistic distribution (4 settled, 1 in-transit, 1 pending)
- [ ] Create mock batch transaction references for each deposit
- [ ] Ensure amounts are consistent (statement totals ≈ sum of their deposits)
- [ ] Store seeded processing data outside AppState (static import, read-only)
