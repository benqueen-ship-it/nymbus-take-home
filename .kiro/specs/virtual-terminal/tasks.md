# Tasks: Virtual Terminal & Payment Flow

## Task 1: Payment Form Layout
- [ ] Create VirtualTerminal page component at pages/VirtualTerminal.tsx
- [ ] Build two-column layout: form on left, order summary on right (stacks on mobile)
- [ ] Add page title "Virtual Terminal" with appropriate heading hierarchy
- [ ] Add demo/prototype notice near card fields: "Test mode — no real charges"

## Task 2: Customer & Amount Section
- [ ] Integrate optional CustomerSelector component from customer-management spec
- [ ] Label customer field as optional (e.g., "Customer (optional)" or helper text "Leave blank for walk-in transactions")
- [ ] Wire "Create Customer" shortcut in selector to open quick-create modal
- [ ] Ensure form submits successfully with no customer selected (anonymous transaction)
- [ ] Build amount input with USD formatting, min $0.01 validation
- [ ] Build optional note/memo textarea (max 200 chars with character count)
- [ ] Add accessible labels for all inputs

## Task 3: Tax & Tip Section
- [ ] Build tax toggle switch that reads merchant's tax config
- [ ] Show tax rate label when enabled (e.g., "Sales Tax 8.25%")
- [ ] If tax is disabled in merchant settings, hide the toggle or show disabled state with explanation
- [ ] Build tip amount input (optional, USD format)
- [ ] Validate tip is ≥ $0.00 if entered

## Task 4: Order Summary
- [ ] Build read-only OrderSummary component showing subtotal, tax, tip, total
- [ ] Implement calculateOrder utility function with proper rounding
- [ ] Wire real-time updates as form values change
- [ ] Style total prominently (larger font, bold)
- [ ] Show line items only when applicable (hide tax line when tax is off, hide tip when $0)

## Task 5: Card Entry Fields
- [ ] Build CardholderName input (text, required)
- [ ] Build CardNumber input with auto-formatting (groups of 4, spaces)
- [ ] Display detected card brand icon/label as user types (Visa/MC/Amex/Discover)
- [ ] Build Expiration input with MM/YY format and auto-slash insertion
- [ ] Build CVV input (password/masked, 3-4 digits)
- [ ] Add helper text: "Use any test card number. Cards ending in 0000 will be declined."
- [ ] Ensure no card data leaks to global state or localStorage

## Task 6: Form Validation
- [ ] Implement validation rules: amount > 0, cardholder required, card 16 digits, exp valid future date, CVV 3-4 digits (customer is optional)
- [ ] Show inline error messages below fields on blur and on submit attempt
- [ ] Disable submit button when form is incomplete or has errors
- [ ] Highlight invalid fields with red border

## Task 7: Payment Processing Simulation
- [ ] Implement submit handler that sets state to 'processing'
- [ ] Show fullscreen or overlay processing state with spinner and "Authorizing payment..." text
- [ ] Disable form interaction during processing
- [ ] After 1.5–2s delay (setTimeout), evaluate decline condition
- [ ] If card ends in 0000: set state to 'declined', show error message
- [ ] If approved: create transaction, set state to 'approved', navigate to confirmation

## Task 8: Decline Handling
- [ ] Build decline error message component with red styling
- [ ] Show message: "Payment declined — card ending in XXXX was not approved. No charge was made."
- [ ] Keep form populated on decline so user can correct and retry
- [ ] Add "Try Again" action that clears the error state
- [ ] Do NOT create a transaction record on decline

## Task 9: Transaction Creation on Approval
- [ ] Generate unique transaction ID (txn_ prefix + random string)
- [ ] Build transaction payload with all required fields
- [ ] Dispatch ADD_TRANSACTION to global state
- [ ] Verify transaction appears in state (will show in transaction list)
- [ ] Navigate to PaymentConfirmation view with transaction ID

## Task 10: Payment Confirmation & Receipt
- [ ] Create PaymentConfirmation page/component
- [ ] Display success header with checkmark icon
- [ ] Show receipt details: merchant name, txn ID, date/time, customer, note, card info, line items, status
- [ ] Style as a professional receipt layout
- [ ] Add "Print Receipt" button triggering window.print()
- [ ] Add print-specific CSS (@media print) hiding non-receipt elements
- [ ] Add "Email Receipt" button → confirmation dialog → success toast (no real email)
- [ ] Add "New Payment" button → navigate back to fresh VT form

## Task 11: Form Reset
- [ ] Clear all form fields after successful payment and navigation back to VT
- [ ] Ensure card data is cleared from component state on unmount
- [ ] Reset payment state to 'idle' on fresh VT load
