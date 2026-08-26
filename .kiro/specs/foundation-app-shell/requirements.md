# Requirements: Foundation & App Shell

## Problem Statement

A small-business merchant needs a modern, professional web portal to manage payments, customers, and invoices. Before any feature can function, the application needs a solid architectural foundation: routing, navigation, global state, theming, and merchant configuration. This spec establishes the skeleton that all subsequent features plug into.

## User Persona

**Merchant Administrator** — A small-business owner or operations manager who processes card payments, manages customers, and sends invoices. They are already authenticated (no auth in scope) and expect a clean, desktop-first experience that works on tablets.

## Functional Requirements

### FR-1: Application Shell Layout
- FR-1.1: The app must render a responsive desktop-first layout with a persistent left sidebar and main content area.
- FR-1.2: The sidebar must contain navigation links for: Dashboard, Virtual Terminal, Transactions, Customers, Invoices, Processing, Settings.
- FR-1.3: The currently active route must be visually highlighted in the navigation.
- FR-1.4: The sidebar must display the merchant's configured display name.
- FR-1.5: A top bar or header area must show a simple merchant-admin profile/menu (static, non-functional avatar + name).
- FR-1.6: On tablet/mobile widths, the sidebar must collapse to an icon-only or hamburger pattern.

### FR-2: Client-Side Routing
- FR-2.1: The app must use client-side routing (React Router) for all navigation without full page reloads.
- FR-2.2: Routes must include: `/`, `/terminal`, `/transactions`, `/transactions/:id`, `/customers`, `/customers/:id`, `/invoices`, `/invoices/:id`, `/processing`, `/settings`, `/pay/:invoiceId`.
- FR-2.3: Unknown routes must render a 404 Not Found page with navigation back to Dashboard.
- FR-2.4: The `/pay/:invoiceId` route must render outside the app shell (no sidebar) as a customer-facing page.

### FR-3: Global State & Data Layer
- FR-3.1: The app must maintain global state for: merchants settings, customers, transactions, and invoices.
- FR-3.2: State must persist to localStorage when available.
- FR-3.3: If localStorage is unavailable or errors, the app must remain functional with in-memory state only.
- FR-3.4: On initial load, the app must seed realistic sample data (customers, transactions, invoices) if no persisted state exists.
- FR-3.5: A "Reset Demo Data" action must be available in Settings to restore the original seed data.

### FR-4: Merchant Settings
- FR-4.1: A Settings page must allow editing: business legal name, DBA/display name, Tax ID, website URL, phone number, support email, and business address.
- FR-4.2: All settings fields must have accessible labels and appropriate input types.
- FR-4.3: Settings must persist to localStorage.
- FR-4.4: The display name must propagate immediately to the sidebar and any branding surfaces.

### FR-7: Business Address with Google Address Validation
- FR-7.1: The merchant settings must include a business address section with fields for: street address, city, state, and ZIP code.
- FR-7.2: The address input must integrate with Google Places Autocomplete API to provide type-ahead address suggestions as the user types.
- FR-7.3: When a user selects a suggested address, all address fields (street, city, state, ZIP) must auto-populate from the selected result.
- FR-7.4: After selection or manual entry, the address must be validated against the Google Address Validation API to confirm it is a real, deliverable US physical address.
- FR-7.5: If validation confirms the address is valid, display a green checkmark and "Address verified" confirmation.
- FR-7.6: If validation returns an issue (not found, not deliverable, or non-US), display a clear warning: "Could not verify this address. Please enter a valid US physical address."
- FR-7.7: If the API suggests a corrected/standardized version of the address, show the suggestion and allow the user to accept it.
- FR-7.8: Address validation must not block saving — the merchant can save an unverified address, but the verification status must be clearly displayed.
- FR-7.9: The Google API key must be provided via an environment variable (VITE_GOOGLE_MAPS_API_KEY) and never hardcoded in source.
- FR-7.10: If the API key is missing or the API is unreachable, the address fields must still function as plain text inputs with a notice that verification is unavailable.

### FR-5: Branding Configuration
- FR-5.1: Settings must include branding controls: primary color, secondary color, and logo URL (or selectable placeholder).
- FR-5.2: Primary and secondary colors must use a color picker input.
- FR-5.3: Branding must apply dynamically to: hosted invoice payment page and email preview templates.
- FR-5.4: A live preview of branding changes should be shown in Settings.

### FR-6: Tax Configuration
- FR-6.1: Settings must include a tax configuration section.
- FR-6.2: Allow configuration of one named percentage-based tax rate (e.g., "Sales Tax" at 8.25%).
- FR-6.3: Allow enabling/disabling the tax rate independently for Virtual Terminal and Invoice creation.
- FR-6.4: When enabled, the configured rate must be available in VT and Invoice forms for application to totals.

### FR-8: Dev Controls Panel
- FR-8.1: The app must include a toggleable Dev Controls panel accessible from a floating button (bottom-right corner) or via keyboard shortcut (Ctrl+Shift+D).
- FR-8.2: The panel must provide simulation toggles that affect app behavior globally and per-page.
- FR-8.3: Global simulation toggles must include:
  - "Offline Mode" — simulates network unavailability; any API call (e.g., address validation) shows an offline/network-error state.
  - "Slow Network" — adds artificial 3–5 second delays to all simulated async operations.
  - "Force Loading States" — forces all pages into a loading skeleton state until manually dismissed.
  - "localStorage Unavailable" — simulates localStorage failure; app uses in-memory fallback and shows a subtle banner.
- FR-8.4: Page-specific simulation toggles must include:
  - Virtual Terminal: "Force Payment Decline" (overrides any card to decline), "Force Processing Timeout" (spinner never resolves until manually dismissed), "Force Gateway Error" (shows a generic processing error different from a decline).
  - Invoices: "Force Send Failure" (email send shows error toast), "Force Payment Page Error" (hosted payment page shows a processing error).
  - Transactions: "Force Refund Failure" (refund processing shows error after delay).
  - Settings: "Force Address Validation Failure" (Google API returns error), "Force Save Failure" (settings save shows error).
  - Dashboard: "Empty State" (shows dashboard with zero transactions/invoices).
- FR-8.5: Active simulations must be indicated by a visible badge on the Dev Controls button (count of active overrides).
- FR-8.6: Dev Controls state must NOT persist to localStorage (resets on refresh) to avoid confusing real vs. simulated behavior.
- FR-8.7: The panel must include a "Reset All" button that clears all active simulations.
- FR-8.8: The Dev Controls panel should be visually distinct (dark overlay or drawer) so it is clearly a development/demo tool, not part of the merchant UI.

## Non-Functional Requirements

- NFR-1: The app must load and render the shell within 2 seconds on a standard broadband connection.
- NFR-2: All interactive elements must be keyboard-accessible with visible focus states.
- NFR-3: Color contrast must meet WCAG AA minimum (4.5:1 for text, 3:1 for UI components).
- NFR-4: The design must feel professional, calm, and appropriate for financial operations — no playful colors or informal typography.
- NFR-5: TypeScript strict mode must be enabled project-wide.

## Out of Scope

- Authentication, user management, roles, permissions
- Multi-merchant or multi-user support
- Real logo upload or cloud file storage
- Tax jurisdiction management, multiple tax rates, exemptions
- Tax ID verification or business data validation (beyond address)
- International address validation (US only)
