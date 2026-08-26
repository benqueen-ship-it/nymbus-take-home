# Requirements: Virtual Terminal & Payment Flow

## Problem Statement

A merchant needs to accept card-not-present payments from customers without physical POS hardware. The virtual terminal provides a simple payment form where the merchant enters sale details and card information on behalf of a customer (e.g., over the phone or in person at a desk). After processing, the merchant needs a printable/emailable receipt as proof of payment.

## User Persona

**Merchant Administrator** — takes card payments from customers during phone calls, in-person visits, or service appointments. Expects a fast, clear form that minimizes data entry errors and provides immediate feedback on approval or decline.

## Functional Requirements

### FR-1: Payment Form
- FR-1.1: The Virtual Terminal page must display a single-page payment form.
- FR-1.2: The form must include an optional CustomerSelector component to associate a payment with an existing customer or create a new one inline. Customer selection is not required — the VT must support anonymous/walk-in transactions where no customer is selected.
- FR-1.3: The form must include a payment amount field (USD, two decimal places, minimum $0.01).
- FR-1.4: The form must include an optional sale note/memo field (max 200 characters).
- FR-1.5: The form must include a tax toggle that, when enabled, applies the merchant's configured tax rate.
- FR-1.6: The form must include an optional tip amount field (USD, two decimal places).
- FR-1.7: The form must include a read-only order summary section showing: subtotal, tax (if applied), tip (if entered), and total.
- FR-1.8: The order summary must update in real-time as the merchant adjusts amount, tax toggle, or tip.

### FR-2: Card Entry Fields
- FR-2.1: The form must include clearly fictional card entry fields: cardholder name, card number, expiration date (MM/YY), and CVV.
- FR-2.2: Card fields must display a clear visual indicator or helper text that this is a prototype/demo (e.g., "Test card data only").
- FR-2.3: Card number input must accept 16 digits and format display with spaces (XXXX XXXX XXXX XXXX).
- FR-2.4: CVV input must accept 3–4 digits and mask input.
- FR-2.5: Expiration must accept MM/YY format with auto-slash insertion.

### FR-3: Client-Side Validation
- FR-3.1: Required fields: amount, cardholder name, card number, expiration, CVV. Customer is optional.
- FR-3.2: Amount must be > $0.00.
- FR-3.3: Card number must be exactly 16 digits.
- FR-3.4: Expiration must be a valid future MM/YY.
- FR-3.5: CVV must be 3–4 digits.
- FR-3.6: Validation errors must appear inline below the relevant field.
- FR-3.7: The submit button must be disabled while any required field is empty.

### FR-4: Payment Simulation
- FR-4.1: On valid form submission, show a "Processing payment..." loading state with a spinner (1.5–2 second simulated delay).
- FR-4.2: Default behavior: approve the payment and create a Completed transaction record.
- FR-4.3: Decline scenario: if the card number matches a designated test pattern (card number ending in `0000`), simulate a decline.
- FR-4.4: On decline, display a clear error message: "Payment declined — card ending in XXXX was not approved. No charge was made." Do not create a transaction record.
- FR-4.5: After decline, the form must remain populated so the merchant can correct the card and retry.

### FR-5: Successful Payment Processing
- FR-5.1: On approval, create a new Transaction record with: generated ID, customer ID (or null for anonymous), amount, tax, tip, total, status "completed", masked card (last 4 digits), card brand (derived from first digit), cardholder name, note, and timestamp.
- FR-5.2: Never persist full card number or CVV. Store only: masked card (•••• XXXX), cardholder name, and derived card brand.
- FR-5.3: Card brand derivation: 4=Visa, 5=Mastercard, 3=Amex, 6=Discover, other=Unknown.
- FR-5.4: After successful creation, navigate to the payment confirmation/receipt screen.

### FR-6: Payment Confirmation & Receipt
- FR-6.1: Display an in-app confirmation screen showing: merchant name, transaction ID, date/time, customer name, sale note, masked card + brand, subtotal, tax, tip, total, and "Completed" status badge.
- FR-6.2: Include a "Print Receipt" button that triggers `window.print()` with a print-optimized layout.
- FR-6.3: Include an "Email Receipt" button that opens a confirmation dialog ("Send receipt to [customer email]?"), then shows a success toast. Do not actually send email.
- FR-6.4: Include a "New Payment" button that returns to a fresh Virtual Terminal form.
- FR-6.5: The receipt layout must be clean and professional, suitable for printing on standard paper.

## Edge Cases & Error States

- **Card declined (0000 pattern)**: Show clear "Payment declined" message, form remains populated for correction. No transaction created.
- **Processing timeout (Dev Controls)**: Spinner stays indefinitely. After 10 seconds show a "Cancel" button. On cancel, return to form (no transaction created).
- **Gateway error (Dev Controls)**: Different from decline — shows "We encountered a processing error. No charge was made. Please try again." with Retry button.
- **Zero-amount entry**: Validation prevents submitting $0.00. Inline error: "Amount must be greater than $0.00."
- **Expired card**: If expiration MM/YY is in the past, show inline error: "Card is expired."
- **Incomplete card number**: If less than 16 digits on submit attempt, show: "Card number must be 16 digits."
- **Anonymous transaction**: No customer selected — transaction is created with `customerId: null`, receipt shows "Walk-in Customer."
- **Very large amounts**: Format correctly with commas (e.g., $12,500.00). No upper limit enforced but display must not break.
- **Tip larger than amount**: Allowed (generous tip). No validation cap.
- **Network offline (Dev Controls)**: On submit, show error: "Unable to process payment — you appear to be offline."
- **Double-click prevention**: Submit button disabled during processing state.
- **Browser back during processing**: If user navigates away during the 1.5s delay, no transaction is created (operation cancelled).
- **Form reset after success**: Navigating to "New Payment" from receipt completely clears all form state including card fields.

## Non-Functional Requirements

- NFR-1: The payment form must be completable via keyboard alone (tab order: customer → amount → note → tax toggle → tip → card fields → submit).
- NFR-2: The simulated processing delay must be 1.5–2 seconds to feel realistic without frustrating the user.
- NFR-3: Card number must never appear in localStorage, console logs, or React DevTools state.
- NFR-4: The form must remain usable on tablet widths (stack layout if needed).

## Out of Scope

- Real payment processing, tokenization, PCI compliance
- Partial authorization or retry logic
- Multiple payment methods (ACH, check, etc.)
- Recurring/scheduled payments
- Card-on-file or saved payment methods
- QR code receipts
- Tip suggestions/percentages (only flat amount)
