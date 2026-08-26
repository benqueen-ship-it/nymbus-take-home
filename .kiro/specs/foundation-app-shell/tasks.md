# Tasks: Foundation & App Shell

## Task 1: Project Scaffolding
- [ ] Initialize Vite + React + TypeScript project
- [ ] Install dependencies: react-router-dom, tailwindcss, postcss, autoprefixer, lucide-react, date-fns
- [ ] Configure Tailwind with custom color palette (slate/gray-based for financial UI)
- [ ] Enable TypeScript strict mode in tsconfig.json
- [ ] Set up base CSS with Tailwind directives and CSS custom properties for branding colors
- [ ] Create folder structure: components/, pages/, context/, data/, utils/

## Task 2: TypeScript Data Models
- [ ] Define MerchantSettings interface in data/types.ts
- [ ] Define Customer interface (id, firstName, lastName, email, phone, status, createdAt)
- [ ] Define Transaction interface (id, customerId (nullable for anonymous), amount, tax, tip, total, status, paymentMethod, cardBrand, maskedCard, cardholderName, note, createdAt, refundedAt, refundId, chargebackReason)
- [ ] Define Invoice interface (id, customerId, invoiceNumber, description, amount, taxAmount, total, status, issueDate, dueDate, sentAt, paidAt, refundedAt, writtenOffAt, lastReminderSentAt, linkedTransactionId)
- [ ] Define AppState interface combining all entities
- [ ] Define action types for the reducer (ADD_CUSTOMER, UPDATE_CUSTOMER, ADD_TRANSACTION, UPDATE_TRANSACTION, ADD_INVOICE, UPDATE_INVOICE, UPDATE_MERCHANT, RESET_DATA)

## Task 3: State Management & Persistence
- [ ] Implement AppStateContext with createContext for state and dispatch
- [ ] Implement appReducer handling all action types
- [ ] Create AppStateProvider component that initializes from localStorage or seed data
- [ ] Implement useEffect-based persistence that writes to localStorage on state changes
- [ ] Add try/catch around localStorage operations with console.warn fallback
- [ ] Create custom hooks: useAppState(), useAppDispatch(), useMerchant()

## Task 4: Seed Data Generation
- [ ] Create seed merchant profile with realistic defaults (name, branding colors, tax config)
- [ ] Generate 10 sample customers with varied names, emails, phone numbers, active/inactive statuses
- [ ] Generate 25 sample transactions spanning last 60 days with distribution: 18 Completed, 3 Pending, 2 Declined, 1 Refunded, 1 Chargeback
- [ ] Generate 10 sample invoices: 2 Draft, 3 Outstanding, 2 Overdue, 2 Paid, 1 Written Off
- [ ] Ensure referential integrity — transactions and invoices reference valid customer IDs
- [ ] Use deterministic IDs for cross-reference (txn_seed_001, cust_seed_001, inv_seed_001)

## Task 5: App Shell Layout & Navigation
- [ ] Create AppShell component with sidebar + main content area using flex layout
- [ ] Build Sidebar component with nav links using NavLink from React Router
- [ ] Style active route with highlighted background and accent color
- [ ] Display merchant display name and placeholder logo in sidebar
- [ ] Build TopBar component with merchant admin name and avatar placeholder
- [ ] Implement responsive behavior: full sidebar ≥1024px, icon-only 768–1023px, hamburger <768px
- [ ] Add mobile overlay sidebar with backdrop and close on navigation

## Task 6: Routing Setup
- [ ] Configure BrowserRouter with route structure in App.tsx
- [ ] Create AppShell layout route with nested child routes using Outlet
- [ ] Set up `/pay/:invoiceId` route outside AppShell layout
- [ ] Create NotFound page component with navigation link
- [ ] Create placeholder page components for all routes (will be implemented in later specs)
- [ ] Verify client-side navigation works without page reloads

## Task 7: Settings Page — Merchant Profile
- [ ] Build Settings page with tabbed or sectioned layout: Profile, Branding, Tax
- [ ] Create merchant profile form with inputs for: legal name, display name, Tax ID, website, phone, support email
- [ ] Add accessible labels, placeholder text, and appropriate input types (tel, email, url)
- [ ] Implement save handler that dispatches UPDATE_MERCHANT action
- [ ] Show success feedback (toast or inline message) on save
- [ ] Validate required fields (display name at minimum)

## Task 7b: Business Address with Google Address Validation
- [ ] Add business address section to merchant profile: street, city, state, ZIP fields
- [ ] Create .env.example with VITE_GOOGLE_MAPS_API_KEY placeholder
- [ ] Add .env to .gitignore
- [ ] Create useGooglePlaces custom hook that loads Google Maps JS SDK (Places library)
- [ ] Implement address autocomplete: debounced (300ms) suggestions as user types in street field
- [ ] Restrict autocomplete to US addresses only (componentRestrictions: {country: 'us'})
- [ ] Build AddressSuggestionDropdown component with keyboard navigation
- [ ] On suggestion selection: parse place details and auto-populate street, city, state, ZIP
- [ ] Create useAddressValidation hook that calls Google Address Validation API
- [ ] Trigger validation on blur from address fields or on save
- [ ] Display verification result: green checkmark + "Address verified" for valid, warning for invalid
- [ ] If API suggests a standardized address, show "Did you mean: [corrected address]?" with Accept/Dismiss
- [ ] Store verification status (verified: boolean, verifiedAt: timestamp) with the address
- [ ] Implement graceful degradation: if API key is missing, show plain inputs + notice
- [ ] Handle API errors gracefully (network failure, quota exceeded) — show warning, allow manual save

## Task 8: Settings Page — Branding
- [ ] Create branding section with color picker inputs for primary and secondary color
- [ ] Add logo URL text input with a few selectable placeholder options
- [ ] Implement live preview panel showing how branding looks (mini invoice header mockup)
- [ ] Wire color values to CSS custom properties for dynamic theming
- [ ] Persist branding changes through the same UPDATE_MERCHANT dispatch

## Task 9: Settings Page — Tax Configuration
- [ ] Create tax config section with: tax name input, rate percentage input, enable/disable toggles
- [ ] Add toggle for "Apply to Virtual Terminal" and "Apply to Invoices"
- [ ] Validate rate is between 0–100 with appropriate step (0.01)
- [ ] Show formatted preview: "Sales Tax: 8.25%"
- [ ] Persist through UPDATE_MERCHANT dispatch

## Task 10: Shared UI Components
- [ ] Create Button component with variants: primary, secondary, outline, danger, ghost
- [ ] Create Input component with label, error state, and helper text support
- [ ] Create StatusBadge component with color mapping for all statuses (Completed=green, Pending=yellow, Declined=red, Refunded=blue, Chargeback=purple, Draft=gray, Outstanding=yellow, Overdue=red, Paid=green, Written Off=gray)
- [ ] Create Card component for dashboard summary cards and content containers
- [ ] Create Modal component with backdrop, focus trap, and close handling
- [ ] Create Toast/notification system for success/error feedback
- [ ] Create EmptyState component for lists with no data
- [ ] Create LoadingSpinner component for simulated async states

## Task 11: Reset Demo Data
- [ ] Add "Reset Demo Data" button in Settings with danger styling
- [ ] Show confirmation modal warning data will be lost
- [ ] On confirm, dispatch RESET_DATA action that clears localStorage and reinitializes seed data
- [ ] Show success toast after reset

## Task 12: Dev Controls Panel — Infrastructure
- [ ] Create DevControlsContext with DevControlsState interface (all booleans, default false)
- [ ] Create DevControlsProvider (wraps app, state held in useState — never persisted)
- [ ] Create useDevControls() and useDevControlsDispatch() hooks
- [ ] Register keyboard shortcut Ctrl+Shift+D to toggle panel visibility
- [ ] Build floating toggle button (bottom-right corner, 🛠 icon) with active-overrides count badge

## Task 13: Dev Controls Panel — UI
- [ ] Build slide-up drawer/panel with dark background and clear "Dev Controls" header
- [ ] Add "Reset All" button that reverts all toggles to false
- [ ] Create toggle sections: Global, Virtual Terminal, Invoicing, Transactions, Settings, Dashboard
- [ ] Add labeled toggle switches for each simulation option
- [ ] Show brief description under each toggle (what it simulates)
- [ ] Ensure panel is scrollable if content overflows viewport
- [ ] Panel must not interfere with page interactions when closed

## Task 14: Dev Controls — Global Simulations
- [ ] Implement "Offline Mode" — wrap simulated async operations to throw NETWORK_ERROR
- [ ] Implement "Slow Network" — add 3–5 second random delay to all async simulations
- [ ] Implement "Force Loading States" — pages check this flag and show skeleton/loading indefinitely
- [ ] Implement "localStorage Unavailable" — override storage helpers to throw, show fallback banner
- [ ] Create reusable useSimulatedAsync hook that respects global dev controls
- [ ] Build error state components: ErrorState (full-page), InlineError (form-level), WarningBanner (persistent)

## Task 15: Dev Controls — Feature-Specific Simulations
- [ ] Wire "Force Payment Decline" into VT submit logic (overrides card-check)
- [ ] Wire "Force Processing Timeout" into VT (spinner never resolves, show "Cancel" after 10s)
- [ ] Wire "Force Gateway Error" into VT (shows distinct error from decline: "Processing error — please try again")
- [ ] Wire "Force Send Failure" into invoice send flow (toast: "Failed to send invoice")
- [ ] Wire "Force Payment Page Error" into hosted payment page submit
- [ ] Wire "Force Refund Failure" into refund confirmation flow (toast: "Refund failed")
- [ ] Wire "Force Address Validation Failure" into address validation hook
- [ ] Wire "Force Save Failure" into settings save handler
- [ ] Wire "Dashboard Empty State" to show dashboard with zero data regardless of actual state
