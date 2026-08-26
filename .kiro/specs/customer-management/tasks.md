# Tasks: Customer Management

## Task 1: Customer List Page
- [ ] Create CustomerList page component at pages/Customers.tsx
- [ ] Build customer table with columns: Name, Email, Phone, Status, Total Spend, Last Activity
- [ ] Implement sort by last activity date (most recent first)
- [ ] Add search input above the table that filters by name, email, or phone
- [ ] Show result count (e.g., "Showing 8 of 12 customers")
- [ ] Create empty state for when no customers match search
- [ ] Add "New Customer" button in page header
- [ ] Implement responsive layout: table on desktop, card list on mobile

## Task 2: Customer Detail Page
- [ ] Create CustomerDetail page component at pages/CustomerDetail.tsx
- [ ] Fetch customer by ID from route params, show 404 if not found
- [ ] Build contact info card with all fields and status badge
- [ ] Add Edit button linking to edit form
- [ ] Add Activate/Deactivate button with appropriate label based on current status
- [ ] Build customer metrics section: total spend, total invoiced, transaction count
- [ ] Build "Recent Transactions" section showing last 10 transactions for this customer
- [ ] Build "Recent Invoices" section showing last 10 invoices for this customer
- [ ] Add breadcrumb navigation: Customers > [Customer Name]

## Task 3: Customer Form (Create & Edit)
- [ ] Create CustomerForm component (reusable for create and edit modes)
- [ ] Add fields: firstName (required), lastName (required), email (required), phone (optional)
- [ ] Implement client-side validation: required field checks, email format validation
- [ ] Implement email uniqueness check against existing customers (exclude current in edit mode)
- [ ] Show inline validation errors below each field
- [ ] Show "A customer with this email already exists" for duplicate emails
- [ ] Add Submit and Cancel buttons
- [ ] On successful create: dispatch ADD_CUSTOMER, navigate to new customer detail
- [ ] On successful edit: dispatch UPDATE_CUSTOMER, return to customer detail with success toast

## Task 4: Create Customer Modal
- [ ] Create a modal wrapper for CustomerForm (for quick-create from VT/Invoice flows)
- [ ] On successful creation, return the new customer ID to the calling component
- [ ] Ensure modal can be dismissed without saving (Cancel / click outside / Escape)

## Task 5: Activate / Deactivate
- [ ] Add confirmation modal for deactivation with explanatory text
- [ ] Add confirmation modal for reactivation
- [ ] On confirm, dispatch UPDATE_CUSTOMER with status change
- [ ] Update UI immediately (button label, status badge)
- [ ] Show success toast

## Task 6: Customer Selector Component
- [ ] Create reusable CustomerSelector component (combobox-style)
- [ ] Show searchable dropdown of active customers: "FirstName LastName (email)"
- [ ] Add "+ New Customer" option at the bottom of the dropdown
- [ ] Wire onCreateNew to open the quick-create modal
- [ ] Auto-select newly created customer after modal closes
- [ ] Support keyboard navigation within the dropdown
