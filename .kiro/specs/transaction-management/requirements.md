# Requirements: Transaction Management & Refunds

## Problem Statement

After processing payments through the virtual terminal or receiving invoice payments, merchants need to view, search, filter, and act on their transaction history. The most critical action is issuing refunds for completed transactions. Without a transaction management view, merchants have no visibility into their payment activity and cannot resolve customer disputes.

## User Persona

**Merchant Administrator** — reviews daily transaction activity, looks up specific transactions for customer inquiries, and occasionally needs to issue a refund when a customer returns a product or disputes a charge. Expects fast search and clear status visibility.

## Functional Requirements

### FR-1: Transaction List
- FR-1.1: Display a filterable, searchable list of all transactions (seeded + locally created).
- FR-1.2: Each row must show: date/time, transaction ID (truncated), customer name, amount/total, status badge, payment type.
- FR-1.3: Default sort: most recent first.
- FR-1.4: Show a total count and sum of displayed transactions.

### FR-2: Search
- FR-2.1: Provide a search input that filters transactions by: transaction ID, customer name, or customer email.
- FR-2.2: Search must be case-insensitive and support substring matching.
- FR-2.3: Display appropriate empty state when no results match.

### FR-3: Filters
- FR-3.1: Filter by date range (start date, end date pickers).
- FR-3.2: Filter by transaction status: All, Completed, Pending, Declined, Refunded, Chargeback.
- FR-3.3: Filter by payment type/source: All, Virtual Terminal, Invoice Payment.
- FR-3.4: Filters must combine with search (AND logic).
- FR-3.5: Show active filter count and provide a "Clear filters" action.

### FR-4: Transaction Detail View
- FR-4.1: Navigating to `/transactions/:id` must display full transaction details.
- FR-4.2: Show customer section: name, email, and link to customer detail.
- FR-4.3: Show sale details: note/memo, source (Virtual Terminal / Invoice), timestamp.
- FR-4.4: Show receipt details: subtotal, tax, tip, total.
- FR-4.5: Show payment method: card brand icon, masked card number, cardholder name.
- FR-4.6: Show status history/timeline (simple list: Created → Completed, or Created → Completed → Refunded).
- FR-4.7: If refunded, show linked refund data: refund ID, refund date, refund amount.
- FR-4.8: If chargeback, show reason and disputed amount (read-only, informational).

### FR-5: Full Refund
- FR-5.1: A "Refund Payment" action must be available only for transactions with status "completed".
- FR-5.2: Clicking refund must open a confirmation modal showing: transaction ID, customer name, original total, and refund amount (full amount only).
- FR-5.3: The modal must clearly state "This will issue a full refund of $X.XX to the customer's card ending in XXXX."
- FR-5.4: On confirmation, simulate refund processing (1–1.5 second delay with spinner).
- FR-5.5: After processing: create a linked refund transaction record, update the original transaction status to "refunded", and set refundedAt timestamp.
- FR-5.6: Show success confirmation and update the detail view to reflect refunded state.
- FR-5.7: Dashboard metrics must update to reflect the refund (reduces today's sales if same day).

### FR-6: Seeded Chargeback Example
- FR-6.1: Seed data must include one transaction with "chargeback" status.
- FR-6.2: The chargeback detail view must show: reason (e.g., "Unauthorized transaction"), disputed amount, and date of chargeback.
- FR-6.3: No actions are available on chargeback transactions (read-only).
- FR-6.4: Chargeback evidence submission and dispute workflows are explicitly out of scope.

## Edge Cases & Error States

- **Empty transaction list**: New merchant with no transactions — show empty state: "No transactions yet. Process your first payment in the Virtual Terminal."
- **Transaction not found**: `/transactions/invalid-id` shows "Transaction not found" with link back to list.
- **Anonymous transaction in list/detail**: Show "Walk-in Customer" instead of customer name. No link to customer detail. Still refundable.
- **Refund on anonymous transaction**: Allowed — refund confirmation shows "Walk-in Customer" and card details.
- **Already refunded**: "Refund Payment" button must not appear for transactions already in "refunded" status.
- **Double-click on refund confirm**: Disable confirm button immediately after first click. Show spinner on button.
- **Refund failure (Dev Controls)**: After processing delay, show error toast: "Refund could not be processed. Please try again." Original transaction remains unchanged.
- **No search results**: "No transactions match your filters" with "Clear all filters" action.
- **Date range with no results**: Same empty state as above.
- **Chargeback transaction**: Read-only — no action buttons, clear "No actions available" notice.
- **Very long transaction note**: Truncate in list view with ellipsis, show full text in detail view.
- **Refund transaction in list**: Shows as negative amount with "Refund" type label. Clicking opens detail with link to original transaction.

## Non-Functional Requirements

- NFR-1: Transaction list must support 50+ records without perceptible lag.
- NFR-2: Refund confirmation modal must prevent accidental double-submission (disable button after first click).
- NFR-3: Status badges must use consistent colors across the entire application.

## Out of Scope

- Partial refunds
- Refund failure handling
- Settlement timing or batch processing
- Export/download of transaction data
- Void (vs refund) distinction
- Chargeback dispute response or evidence upload
- Transaction editing
