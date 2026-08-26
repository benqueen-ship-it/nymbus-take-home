# Design: Foundation & App Shell

## Architecture Overview

The application is a single-page React app built with TypeScript, using React Router for navigation and React Context + useReducer for global state management. No backend exists — all data lives in localStorage with an in-memory fallback.

```
┌─────────────────────────────────────────────────┐
│                   App Root                        │
│  ┌──────────────────────────────────────────┐   │
│  │         BrowserRouter                     │   │
│  │  ┌─────────┐  ┌────────────────────┐    │   │
│  │  │ Sidebar │  │   Main Content     │    │   │
│  │  │  Nav    │  │   (Route Outlet)   │    │   │
│  │  └─────────┘  └────────────────────┘    │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │      AppStateProvider (Context)           │   │
│  │  ┌────────────────────────────────────┐  │   │
│  │  │   LocalStorage Persistence Layer   │  │   │
│  │  └────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## Technology Choices

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Framework | React 18+ | Industry standard, component model fits well |
| Language | TypeScript (strict) | Type safety for financial data models |
| Routing | React Router v6 | Declarative, layout-based routing |
| State | Context + useReducer | Sufficient for single-user app, no Redux overhead |
| Styling | Tailwind CSS | Rapid prototyping, design consistency, responsive utilities |
| Build | Vite | Fast dev server, modern ESM bundling |
| Icons | Lucide React | Clean, professional icon set |
| Date handling | date-fns | Lightweight, tree-shakable |

## Data Models

### MerchantSettings
```typescript
interface MerchantAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  verified: boolean;         // whether Google validated it
  verifiedAt?: string;       // ISO 8601 timestamp of last verification
}

interface MerchantSettings {
  legalName: string;
  displayName: string;
  taxId: string;
  website: string;
  phone: string;
  supportEmail: string;
  address: MerchantAddress;
  branding: {
    primaryColor: string;    // hex
    secondaryColor: string;  // hex
    logoUrl: string;         // URL or placeholder identifier
  };
  taxConfig: {
    name: string;            // e.g., "Sales Tax"
    rate: number;            // e.g., 0.0825 for 8.25%
    enabledForTerminal: boolean;
    enabledForInvoices: boolean;
  };
}
```

## Google Address Validation Integration

### API Services Used

1. **Google Places API (new)** — `AutocompleteSuggestion.fetchAutocompleteSuggestions()` for type-ahead US address suggestions, and the `Place` class with `fetchFields()` to retrieve structured address components. Note: the legacy `AutocompleteService`/`PlacesService` classes are blocked for customers created after March 1, 2025, so the new API classes are required.
2. **Implicit verification** — selecting a Google-suggested address is treated as verification (the address resolves to a real, geocoded US place). A session token is used for autocomplete billing/quality.

### Address editing UX

- The address is displayed read-only with an "Edit" / "Add Address" button.
- The button opens a modal with a single search field.
- Typing queries Google's autocomplete; selecting a result fetches full address components and shows a verified preview.
- "Use This Address" applies all fields (street, city, state, ZIP) at once and marks the address verified.
- City, State, and ZIP are never manually editable — they come only from a verified Google result.

### Architecture

```
AddressInput component
├── useGooglePlaces hook (autocomplete)
│   └── Calls Places Autocomplete API on keystroke (debounced 300ms)
├── AddressSuggestionDropdown
│   └── User selects → auto-populates fields
└── useAddressValidation hook
    └── Calls Address Validation API on blur/save
    └── Returns: { isValid, standardizedAddress, issues[] }
```

### API Key Management

- Stored in `.env` as `VITE_GOOGLE_MAPS_API_KEY`
- Accessed via `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`
- Never committed to source control (listed in .gitignore)
- `.env.example` provided with placeholder

### Google Places Autocomplete Integration

```typescript
// Load Google Maps JS SDK with Places library
// Use the Autocomplete service restricted to 'address' type and US region

interface PlacePrediction {
  placeId: string;
  description: string;       // full formatted address
  mainText: string;          // street number + name
  secondaryText: string;     // city, state, ZIP
}

async function getAddressSuggestions(input: string): Promise<PlacePrediction[]> {
  // Uses google.maps.places.AutocompleteService
  // Restricted to: types=['address'], componentRestrictions={country:'us'}
}

async function getPlaceDetails(placeId: string): Promise<MerchantAddress> {
  // Uses google.maps.places.PlacesService.getDetails
  // Extracts: street_number, route, locality, administrative_area_level_1, postal_code
}
```

### Google Address Validation API

```typescript
interface AddressValidationResult {
  isValid: boolean;
  validationGranularity: 'PREMISE' | 'SUB_PREMISE' | 'ROUTE' | 'OTHER';
  standardizedAddress?: MerchantAddress;  // corrected/formatted version
  issues: string[];                        // human-readable issues
}

async function validateAddress(address: MerchantAddress): Promise<AddressValidationResult> {
  // POST to https://addressvalidation.googleapis.com/v1:validateAddress
  // Request body: { address: { regionCode: 'US', addressLines: [...] } }
  // Returns verdict with validation granularity and standardized address
}
```

### Graceful Degradation

- If `VITE_GOOGLE_MAPS_API_KEY` is not set: autocomplete and validation are disabled, fields work as plain text inputs, a notice displays "Address verification unavailable — API key not configured"
- If API call fails (network error, quota exceeded): show warning toast, allow manual entry, mark as unverified
- Verification status is stored with the address so it persists across sessions

### AppState (top-level)
```typescript
interface AppState {
  merchant: MerchantSettings;
  customers: Customer[];
  transactions: Transaction[];
  invoices: Invoice[];
}
```

## State Management Pattern

```
Action dispatched → Reducer updates state → 
  useEffect persists to localStorage → 
    Components re-render via context
```

- `AppStateContext` provides read access to state
- `AppDispatchContext` provides dispatch function
- Persistence is a side effect of state changes, not inline with dispatch
- On mount: attempt to load from localStorage → fallback to seed data

## Layout Structure

```
Desktop (≥1024px):
┌──────────┬────────────────────────────────┐
│  Sidebar │       Top Bar (profile)        │
│  (240px) ├────────────────────────────────┤
│  fixed   │                                │
│          │       Page Content             │
│  - Logo  │       (scrollable)             │
│  - Nav   │                                │
│  - Name  │                                │
└──────────┴────────────────────────────────┘

Tablet (768–1023px):
┌────┬──────────────────────────────────────┐
│Icon│       Top Bar                         │
│Nav ├──────────────────────────────────────┤
│64px│       Page Content                    │
└────┴──────────────────────────────────────┘

Mobile (<768px):
┌──────────────────────────────────────────┐
│  Hamburger │ Top Bar                      │
├──────────────────────────────────────────┤
│       Page Content                        │
└──────────────────────────────────────────┘
(Sidebar opens as overlay)
```

## Routing Configuration

```typescript
const routes = [
  {
    path: '/',
    element: <AppShell />,  // Sidebar + Outlet
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'terminal', element: <VirtualTerminal /> },
      { path: 'transactions', element: <TransactionList /> },
      { path: 'transactions/:id', element: <TransactionDetail /> },
      { path: 'customers', element: <Customers /> },
      { path: 'customers/:id', element: <CustomerDetail /> },
      { path: 'invoices', element: <Invoices /> },
      { path: 'invoices/:id', element: <InvoiceDetail /> },
      { path: 'processing', element: <Processing /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
  { path: '/pay/:invoiceId', element: <HostedPayment /> }, // No shell
  { path: '*', element: <NotFound /> },
];
```

## Seed Data Strategy

On first load (no localStorage key found), populate state with:
- 1 merchant profile with defaults
- 8–12 sample customers
- 20–30 sample transactions spanning last 60 days (mix of statuses)
- 8–12 sample invoices (mix of Draft, Outstanding, Overdue, Paid)
- 1 Chargeback transaction for information architecture

Seed data uses deterministic IDs (e.g., `txn_seed_001`) so they can be referenced across entities.

## Error Handling

- localStorage write failures: catch silently, log to console, continue with in-memory state
- Invalid route: render NotFound component with link to Dashboard
- Missing seed data entity references: gracefully show "Unknown Customer" or similar placeholder

## Dev Controls Panel Architecture

### Context & State

```typescript
interface DevControlsState {
  // Global
  offlineMode: boolean;
  slowNetwork: boolean;
  forceLoadingStates: boolean;
  localStorageUnavailable: boolean;
  // Virtual Terminal
  forcePaymentDecline: boolean;
  forceProcessingTimeout: boolean;
  forceGatewayError: boolean;
  // Invoicing
  forceSendFailure: boolean;
  forcePaymentPageError: boolean;
  // Transactions
  forceRefundFailure: boolean;
  // Settings
  forceAddressValidationFailure: boolean;
  forceSaveFailure: boolean;
  // Dashboard
  dashboardEmptyState: boolean;
}

const defaultDevControls: DevControlsState = {
  offlineMode: false,
  slowNetwork: false,
  forceLoadingStates: false,
  localStorageUnavailable: false,
  forcePaymentDecline: false,
  forceProcessingTimeout: false,
  forceGatewayError: false,
  forceSendFailure: false,
  forcePaymentPageError: false,
  forceRefundFailure: false,
  forceAddressValidationFailure: false,
  forceSaveFailure: false,
  dashboardEmptyState: false,
};
```

### Provider Pattern

```typescript
// DevControlsContext — separate from AppState (never persisted)
const DevControlsContext = createContext<DevControlsState>(defaultDevControls);
const DevControlsDispatchContext = createContext<Dispatch<DevControlsAction>>(() => {});

// Wrap app in DevControlsProvider alongside AppStateProvider
```

### Integration Pattern

Feature components check dev controls before executing simulated async operations:

```typescript
function useSimulatedAsync() {
  const devControls = useDevControls();
  
  return async function simulateAsync<T>(
    operation: () => T,
    options: { delayMs?: number } = {}
  ): Promise<T> {
    const delay = devControls.slowNetwork 
      ? 3000 + Math.random() * 2000  // 3-5s
      : (options.delayMs ?? 1500);
    
    if (devControls.offlineMode) {
      await wait(delay);
      throw new Error('NETWORK_ERROR');
    }
    
    await wait(delay);
    return operation();
  };
}
```

### UI Component

```
DevControlsPanel (floating, bottom-right)
├── ToggleButton (🛠 icon + active count badge)
└── Panel (dark drawer, slides up or right)
    ├── Header: "Dev Controls" + Reset All button
    ├── Section: Global
    │   ├── Toggle: Offline Mode
    │   ├── Toggle: Slow Network
    │   ├── Toggle: Force Loading States
    │   └── Toggle: localStorage Unavailable
    ├── Section: Virtual Terminal
    │   ├── Toggle: Force Decline
    │   ├── Toggle: Processing Timeout
    │   └── Toggle: Gateway Error
    ├── Section: Invoicing
    │   ├── Toggle: Send Failure
    │   └── Toggle: Payment Page Error
    ├── Section: Transactions
    │   └── Toggle: Refund Failure
    ├── Section: Settings
    │   ├── Toggle: Address Validation Failure
    │   └── Toggle: Save Failure
    └── Section: Dashboard
        └── Toggle: Empty State
```

### Error State Components

Reusable error UIs consumed across the app:

```typescript
// Generic error boundary with retry
<ErrorState 
  icon={WifiOff | AlertTriangle | ServerCrash}
  title="Connection lost"
  description="Check your internet connection and try again."
  action={{ label: "Retry", onClick: retry }}
/>

// Inline error for form submissions
<InlineError message="Payment processing failed. Please try again." />

// Banner for persistent issues
<WarningBanner message="Running in offline mode — changes may not be saved." />
```

## File Structure

```
src/
├── main.tsx                    # Entry point
├── App.tsx                     # Router + providers
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx        # Sidebar + Outlet wrapper
│   │   ├── Sidebar.tsx         # Navigation component
│   │   └── TopBar.tsx          # Header with profile
│   ├── address/
│   │   ├── AddressForm.tsx     # Address input with autocomplete
│   │   └── AddressSuggestions.tsx  # Dropdown suggestions list
│   └── ui/                     # Shared UI components
│       ├── StatusBadge.tsx
│       ├── Card.tsx
│       ├── Button.tsx
│       ├── Input.tsx
│       └── ...
├── pages/
│   ├── Dashboard.tsx
│   ├── Settings.tsx
│   └── NotFound.tsx
├── hooks/
│   ├── useGooglePlaces.ts      # Places Autocomplete integration
│   ├── useAddressValidation.ts # Address Validation API integration
│   ├── useDevControls.ts       # Dev Controls context hooks
│   └── useSimulatedAsync.ts    # Async simulation respecting dev controls
├── context/
│   ├── AppStateContext.tsx
│   ├── DevControlsContext.tsx  # Dev Controls state (never persisted)
│   └── reducer.ts
├── data/
│   ├── seed.ts                 # Seed data generation
│   └── types.ts                # TypeScript interfaces
├── utils/
│   ├── storage.ts              # localStorage helpers
│   ├── format.ts               # Currency, date formatting
│   └── constants.ts
└── styles/
    └── index.css               # Tailwind directives + custom tokens
```
