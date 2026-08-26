# Requirements: Customer Management

## Problem Statement

A merchant needs to maintain a directory of their customers to associate payments and invoices with known contacts. Without customer management, the merchant cannot track who they're transacting with, view spending history, or efficiently select recipients for invoices and payments.

## User Persona

**Merchant Administrator** — manages a roster of 10–200 regular customers (small service business, salon, consultancy, repair shop). Needs to quickly find customers by name or email, see their payment history at a glance, and create new customers on the fly during payment flows.

## Functional Requirements

### FR-1: Customer List View
- FR-1.1: Display a searchable, paginated list of all customers.
- FR-1.2: Each row must show: full name, email, phone, status (Active/Inactive), total spend (sum of completed transactions), and date of last activity.
- FR-1.3: Search must filter by name, email, or phone (case-insensitive, substring match).
- FR-1.4: When no customers match the search, display an appropriate empty state.
- FR-1.5: List must be sorted by last activity date (most recent first) by default.

### FR-2: Customer Detail View
- FR-2.1: Navigating to `/customers/:id` must display full customer details.
- FR-2.2: Show contact info section: first name, last name, email, phone, status, customer since date.
- FR-2.3: Show a "Recent Transactions" section listing the customer's transactions (last 10) with links to transaction details.
- FR-2.4: Show a "Recent Invoices" section listing the customer's invoices (last 10) with links to invoice details.
- FR-2.5: Display total spend and total invoice amount metrics for this customer.

### FR-3: Add Customer
- FR-3.1: A "New Customer" button must open a creation form (modal or dedicated page).
- FR-3.2: Required fields: first name, last name, email.
- FR-3.3: Optional fields: phone.
- FR-3.4: Email must be validated for format and must be unique among all existing customer records.
- FR-3.5: If a duplicate email is entered, display a clear inline validation error: "A customer with this email already exists."
- FR-3.6: On successful creation, navigate to the new customer's detail view.
- FR-3.7: New customers default to Active status.

### FR-4: Edit Customer
- FR-4.1: From the customer detail view, an "Edit" action must open an edit form pre-populated with current data.
- FR-4.2: Same fields and validation as creation (email uniqueness excludes the current customer's own email).
- FR-4.3: On save, return to the updated customer detail view with success feedback.

### FR-5: Activate / Deactivate Customer
- FR-5.1: From customer detail, a merchant must be able to deactivate an active customer.
- FR-5.2: Deactivation must show a confirmation dialog explaining the action.
- FR-5.3: Deactivated customers remain in the list but display an "Inactive" status badge.
- FR-5.4: Inactive customers can be reactivated with a similar confirmation.
- FR-5.5: Customer records must never be deleted.

### FR-6: Quick-Create from Other Flows
- FR-6.1: The Virtual Terminal and Invoice creation forms must include a "Create Customer" shortcut that opens a lightweight customer creation form.
- FR-6.2: After successful creation from these flows, the new customer must be auto-selected in the originating form.
- FR-6.3: When the customer creation is triggered from within a modal (e.g., Invoice creation modal), the modal must swap its content to the customer creation form rather than stacking a second modal on top. A "Back" link returns to the original form with state preserved.

## Non-Functional Requirements

- NFR-1: Customer search must feel instant (filter in-memory, no debounce delay needed for <200 records).
- NFR-2: Form inputs must have visible labels, not rely on placeholder text alone.
- NFR-3: Tab order must be logical within all forms.

## Edge Cases & Error States

- **Empty customer list**: New merchant with no customers — show empty state with "Add your first customer" CTA.
- **Search with no results**: Clear message "No customers match your search" with option to clear search.
- **Customer not found (invalid URL)**: `/customers/invalid-id` shows a 404-style "Customer not found" with link back to customer list.
- **Deactivated customer in selector**: Inactive customers should not appear in the CustomerSelector dropdown (only active customers are selectable).
- **Customer with extensive history**: Customer detail page with 50+ transactions/invoices should paginate or limit display gracefully.
- **Duplicate email on edit**: If editing a customer and changing their email to one that already exists on another customer, show the duplicate error.
- **Rapid form submission**: Prevent double-dispatch of ADD_CUSTOMER by disabling submit button after first click.
- **Dev Controls — Force Loading**: Customer list shows skeleton loading state.
- **Dev Controls — localStorage Unavailable**: Customer creation succeeds in memory but shows banner about persistence.

## Out of Scope

- Customer import/export
- Customer grouping or tagging
- Customer-facing login or self-service portal
- Customer notes or internal comments
- Deleting customers
