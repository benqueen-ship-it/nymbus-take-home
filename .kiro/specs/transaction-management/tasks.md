# Tasks: Transaction Management & Refunds

## Task 1: Transaction List Page
- [ ] Create TransactionList page component at pages/Transactions.tsx
- [ ] Build transaction table with columns: Date, ID (truncated), Customer, Amount, Status, Type
- [ ] Implement default sort by createdAt descending
- [ ] Add row click navigation to /transactions/:id
- [ ] Show transaction count and sum in header area
- [ ] Create responsive layout: table on desktop, card list on mobile

## Task 2: Search & Filters
- [ ] Add search input filtering by transaction ID, customer name, or email
- [ ] Build FilterBar component with date range pickers (start/end)
- [ ] Add status filter dropdown/chips: All, Completed, Pending, Declined, Refunded, Chargeback
- [ ] Add source filter: All, Virtual Terminal, Invoice Payment
- [ ] Implement combined filter + search logic (AND)
- [ ] Show active filter count badge
- [ ] Add "Clear all filters" button
- [ ] Show empty state when no transactions match filters

## Task 3: Transaction Detail Page
- [ ] Create TransactionDetail page at pages/TransactionDetail.tsx
- [ ] Fetch transaction by ID from route params, show 404 if not found
- [ ] Build customer info section with link to /customers/:customerId
- [ ] Build sale details card: note, source label, timestamp formatted
- [ ] Build receipt card: subtotal, tax, tip, total line items
- [ ] Build payment method card: brand icon, masked number, cardholder name
- [ ] Add breadcrumb: Transactions > TXN-XXXXX

## Task 4: Status Timeline
- [ ] Build StatusTimeline component (vertical timeline with dots and labels)
- [ ] Show "Created" with timestamp for all transactions
- [ ] Show "Completed" for completed/refunded transactions
- [ ] Show "Refunded" with timestamp for refunded transactions
- [ ] Show "Chargeback Filed" with date for chargeback transactions
- [ ] Style with connecting line and colored dots

## Task 5: Refund Flow
- [ ] Add "Refund Payment" button visible only for status === 'completed' transactions
- [ ] Build RefundConfirmationModal with transaction details and full amount
- [ ] Show warning text: "This will issue a full refund of $X.XX..."
- [ ] Implement confirm handler with simulated 1–1.5s processing delay
- [ ] Disable confirm button during processing (prevent double-submit)
- [ ] On success: dispatch ADD_TRANSACTION (refund record) + UPDATE_TRANSACTION (original → refunded)
- [ ] Close modal, show success toast
- [ ] Detail view updates to show refunded state with refund info card

## Task 6: Refund Info Display
- [ ] Build RefundInfoCard showing: refund ID, date, amount, link to refund transaction
- [ ] Show this card only when transaction status is 'refunded'
- [ ] Hide the "Refund Payment" button for refunded transactions

## Task 7: Chargeback Display
- [ ] Build ChargebackInfoCard showing: reason, disputed amount, chargeback date
- [ ] Show "No action available — dispute response is out of scope" notice
- [ ] Show this card only for chargeback transactions
- [ ] Ensure no action buttons are available for chargeback transactions

## Task 8: Transaction Type Helpers
- [ ] Create utility function for source label mapping (virtual_terminal → "Virtual Terminal", invoice_payment → "Invoice Payment")
- [ ] Create utility for formatting transaction ID display (truncate middle for list, full in detail)
- [ ] Create utility for detecting if a transaction is refundable (status === 'completed' && type === 'payment')
