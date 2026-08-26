# AuraPOS — Merchant Payments Portal

**🔗 Live demo: [nymbus-take-home.vercel.app](https://nymbus-take-home.vercel.app/)**
**📦 Repository: [github.com/benqueen-ship-it/nymbus-take-home](https://github.com/benqueen-ship-it/nymbus-take-home)**

A polished, front-end prototype of a single-merchant SMB payments portal. AuraPOS gives a small business a modern way to take card payments through a **virtual terminal**, collect payments asynchronously through **branded invoices** and a **hosted payment page**, and manage the operational back office — customers, transactions, refunds, and processing statements.

> **Prototype notice:** This is a UI/UX prototype. There is no real payment processing, authentication, or backend. All data is seeded locally and persisted to `localStorage`. No real card data is ever stored or transmitted.

> A companion strategy write-up — [`.kiro/product-context.md`](.kiro/product-context.md) — records the full product rationale, target-user analysis, jobs-to-be-done, deliberate exclusions, success measures, and the decision record behind this build. The summary below distills its thesis.

---

## Strategic context: a payments-led entry point to SMB banking

AuraPOS isn't meant to be a standalone POS. It's designed as the **entry point to a deeper small-business banking relationship** — the first, high-frequency, tangible touchpoint that earns a merchant's trust and opens a path to their operating-account business.

**The thesis:** A bank or banking platform can win new SMB relationships by offering payment acceptance as an operationally bundled entry point — *provided the bundle genuinely improves the merchant's daily work rather than treating banking as a forced attachment.*

The value loop the product is built around:

> **Accept a payment → see the outcome immediately → know when funds arrive → reconcile the deposit → use banking tools that fit the merchant's cash flow.**

Payment acceptance is the right wedge because it's urgent and repeated — a microbusiness has to get paid today. Once payment and settlement data are connected, the banking relationship becomes materially more useful through clearer deposits, transaction-level reconciliation, balance visibility, and cash-flow tooling. The strategy is to **earn account primacy through utility, not mandate it.** In a production offering, the settlement account would be optional at setup but made compelling through faster fund availability, cleaner reconciliation, automated tax/reserve buckets, and cash-flow insights.

### How the current build reflects this
- **The Processing section is the seam to banking.** Statements, deposits (with batch breakdowns), a masked settlement account, and net-vs-gross settlement figures are deliberately modeled — this is where "getting paid" becomes "understanding my money," which is exactly where a banking relationship attaches.
- **Financial state is explicit.** The app distinguishes *approved* from *settled/available* (transaction statuses, deposit settlement states, and a "Next Deposit" metric with a T+2 estimate) rather than implying money is instantly in hand — demonstrating payments literacy and reducing false certainty.
- **Designed for recovery.** Declines, gateway errors, timeouts, and offline states all have safe next actions and never imply a completed payment without a definitive result (exercisable via the Dev Controls panel).
- **Owner-operator first.** No roles, shifts, or permissions — the same person configures the business, takes the sale, and monitors cash. This keeps the core loop fast.

### Where this sits in a broader SMB banking bundle
AuraPOS is the **acquisition layer** of a larger stack. Adjacent products that a connected settlement account would unlock over time:

| Layer | Product | Relationship to AuraPOS |
|-------|---------|-------------------------|
| **Acquisition (this build)** | POS / Virtual Terminal / Invoicing | Get the merchant paid; capture payment + settlement data |
| **Operating account** | Connected settlement account, deposit matching, available-vs-pending balances, cash-flow alerts | Turns payment data into banking utility |
| **Relationship-deepening** | Lending/advances, reserve & tax buckets, AP/payroll, accounting/expense sync | Compelling *after* activation, never as a gate |

A deliberate guardrail from the strategy doc: avoid **"false primacy"** — don't count a merchant as a real banking relationship just because card proceeds land in a settlement account while payroll, vendor payments, savings, and credit live elsewhere. Primacy has to be earned by being genuinely useful.

---

## What I built and why

### The problem
Small businesses, freelancers, and service providers frequently need to accept card payments without investing in physical POS hardware or a heavyweight merchant-services contract. They juggle two distinct payment moments:

1. **Card-present-ish, real-time** — taking a payment over the phone or at a desk (a virtual terminal).
2. **Asynchronous** — billing a client after work is done and letting them pay on their own time (invoicing + a hosted payment link).

Most tools do one well and bolt on the other. AuraPOS treats both as first-class flows and ties them together with shared customers, a unified transaction ledger, and a processing/settlement view that mirrors what a real merchant-services dashboard feels like.

### Who the user is
A **merchant administrator** at a small business (a consultancy, salon, repair shop, catering company, etc.) who processes payments, sends invoices, chases overdue balances, and reconciles deposits. The prototype assumes they're already signed in.

### The end-to-end journey the product supports
1. Create or select a customer
2. Take a sale in the virtual terminal
3. See an approved-payment receipt
4. Watch the transaction land in transaction management
5. Issue a full refund
6. Create and send an invoice
7. Have the customer open a branded hosted invoice page
8. Complete a simulated payment
9. See the invoice, transaction ledger, and dashboard metrics all update live

---

## Feature overview

- **Dashboard** — live metrics (today's sales, outstanding/overdue invoices, next deposit), recent activity, an "attention required" list for overdue invoices, and a monthly processing summary. Everything recomputes as you transact.
- **Virtual Terminal** — amount-first payment form with tip presets (15/18/20% + custom), configurable tax, fictional card entry with brand detection, a simulated authorization state, a predictable decline path (any card ending in `0000`), and printable/emailable receipts.
- **Transactions** — searchable, filterable ledger (by ID, customer, status, source, date range, amount range) with detail views, a status timeline, full refunds, a seeded chargeback for information architecture, and universal receipts for any historical transaction.
- **Customers** — searchable directory with spend metrics, detail views, add/edit with validation (email uniqueness, phone format), activate/deactivate, and a reusable customer selector used across the VT and invoicing flows.
- **Invoicing** — draft/send/re-send, write off, cancel, refund, and reminder actions; branded email previews (new / overdue / paid / refunded); full status lifecycle including render-time overdue detection.
- **Hosted Invoice Payment Page** (`/pay/:invoiceId`) — a standalone, merchant-branded page that handles payable, already-paid, overdue, cancelled, written-off, refunded, and invalid states.
- **Processing** — a read-only back office: current-month summary computed from real activity, downloadable **PDF statements** with a full transaction breakdown, and a deposits table with a batch-breakdown drawer and masked settlement account.
- **Settings** — business profile with validated fields, Google-verified business address, branding (colors + logo) applied live to the hosted page and email previews, a single configurable tax rate, and a "My Account" area for user profile + simulated password reset.
- **Dev Controls panel** (bottom-right wrench icon, or `Ctrl+Shift+D`) — toggles to simulate edge cases: offline mode, slow network, forced loading, forced declines/timeouts/gateway errors, send/refund failures, and an empty dashboard state. This exists so reviewers can exercise the error UX without breaking anything.

---

## APIs integrated and how they serve the product

**Google Places API (new) — `AutocompleteSuggestion` + `Place`**

Used in **Settings → Business Profile** to look up and verify the merchant's physical business address. A merchant's address is meaningful in payments (statements, compliance, receipts), so rather than let someone free-type an unverifiable address, the app:

- Provides type-ahead US address autocomplete as the merchant searches
- Fetches structured address components (street, city, state, ZIP) from the selected place
- Treats a selected Google result as a verified address and records a verification timestamp
- Keeps city/state/ZIP non-editable so they can only come from a verified result

The integration **degrades gracefully**: with no API key configured, the address section becomes read-only with a clear notice, and the rest of the app is fully functional.

> Implementation note: the app targets Google's **new** Places API classes (`AutocompleteSuggestion.fetchAutocompleteSuggestions()` and `Place.fetchFields()`) because the legacy `AutocompleteService`/`PlacesService` classes are blocked for Google customers created after March 1, 2025.

---

## Tech stack

- **React 19 + TypeScript** (strict mode)
- **Vite** for dev/build tooling
- **React Router 7** for routing (including the shell-less `/pay/:invoiceId` route)
- **Tailwind CSS** for styling
- **React Context + useReducer** for global state, persisted to `localStorage`
- **jsPDF + jspdf-autotable** for client-side PDF statement generation
- **lucide-react** for icons, **date-fns** for date formatting

---

## Running locally

### Prerequisites
- Node.js 18+ and npm

### Setup
```bash
# 1. Clone the repo
git clone https://github.com/benqueen-ship-it/nymbus-take-home.git
cd nymbus-take-home

# 2. Install dependencies
npm install

# 3. (Optional) Configure the Google Maps API key for address verification
cp .env.example .env
# then edit .env and set VITE_GOOGLE_MAPS_API_KEY

# 4. Start the dev server
npm run dev
```

Open the URL Vite prints (e.g. `http://localhost:5173`).

The app seeds realistic demo data on first load. To reset it at any time: **Settings → Reset Demo Data**.

### Try the full demo journey
1. **Customers** → add or pick a customer
2. **Virtual Terminal** → enter an amount, use any test card number, submit (use a card ending in `0000` to see a decline)
3. View the receipt → find the transaction in **Transactions** → open it → **Refund Payment**
4. **Invoices → New Invoice** → Save & Send → open the invoice → copy/open its **Payment Link**
5. On the hosted page (`/pay/:invoiceId`), pay with any test card
6. Return to the **Dashboard** and watch the metrics update

### Build
```bash
npm run build      # type-check + production build
npm run preview    # preview the production build
```

---

## Built with Kiro (spec-driven)

This project was built using Kiro's spec-driven workflow. The specs live in [`.kiro/specs/`](.kiro/specs/), organized as six incremental features, each with `requirements.md`, `design.md`, and `tasks.md`:

1. **foundation-app-shell** — architecture, routing, state, settings, branding, tax, address API, dev controls
2. **customer-management** — directory, CRUD, validation, reusable selector
3. **virtual-terminal** — payment form, card simulation, receipts
4. **transaction-management** — ledger, filters, refunds, chargeback IA
5. **invoicing** — creation, lifecycle, email previews, hosted payment page
6. **processing-dashboard** — live metrics, statements, deposits

### AI collaboration context
A Kiro hook captures collaboration context automatically as the project is built. See [`.kiro/ai-collaboration/session-log.md`](.kiro/ai-collaboration/session-log.md) for the running log of prompts, decisions, and iterations — it tells the story of how the product took shape in real time rather than as an after-the-fact summary.

---

## Product decisions & reasoning

- **Amount-first virtual terminal.** The payment amount is the single most important input, so it's the visual hero of the page. Customer association was intentionally demoted to an optional step at the bottom — real POS sales are frequently walk-ins with no customer record.
- **Two payment flows, one ledger.** VT payments and invoice payments both produce `Transaction` records with a `source`, so the transaction ledger, refunds, and processing metrics all work uniformly regardless of how the payment originated.
- **Overdue is derived, not stored.** An invoice's overdue state is computed at render time from its due date rather than persisted, which avoids needing background jobs to flip statuses.
- **Verified-only addresses.** Rather than validating a free-typed address after the fact, the merchant can only set an address by selecting a real Google-verified place. This is a stronger guarantee and a cleaner UX.
- **A Dev Controls panel instead of hidden test hooks.** Error/edge-case handling is a big part of a payments product, so I made it visible and demonstrable. Reviewers can toggle offline mode, declines, failures, and empty states on demand.
- **No stacked modals.** When customer creation is triggered from inside the invoice modal, the modal swaps its own content instead of layering a second modal — a deliberate UX rule applied consistently.
- **Graceful degradation everywhere.** localStorage failure falls back to in-memory state; a missing Google key disables address editing without breaking the app.
- **A $100,000 sanity cap** on payment and invoice amounts as a lightweight guardrail against fat-finger and fraud-scale entries.

---

## What I'd change or add with more time

Rather than adding generic feature breadth, I'd follow the payments-led banking strategy **vertical-by-vertical**, validating adoption at each step before deepening:

1. **Connected operating-account view** (the highest-leverage next increment) — deposit matching, available-vs-pending funds, and simple cash-flow alerts. This is the bridge from "I got paid" to "I bank here," and it's the natural extension of the Processing section already in this build.
2. **Validate one high-value workflow per segment** — e.g., payment links + invoicing for service pros (partly built here), or lightweight catalog/inventory for small retail — chosen based on evidence, not assumption.
3. **Only then** pursue live payment processing, additional payment methods, deeper banking products (lending, reserve/tax buckets, AP/payroll), or multi-user workflows.

Concrete engineering/product items along the way:

- **Real backend + auth** — persist data server-side, add real merchant authentication, and move card simulation behind a real (sandbox) processor like Stripe, with a payment-adapter abstraction so the UI isn't coupled to one processor.
- **Merchant onboarding + KYC/KYB** — the acquisition flow that turns a prototype into a real acquiring/banking product.
- **Partial refunds and partial invoice payments** — currently full-only by design/scope.
- **Recurring invoices and automated dunning** — scheduled sends and reminder cadences for overdue balances.
- **Chargeback/dispute workflow** — the prototype seeds a chargeback for IA but doesn't implement evidence submission.
- **Richer reporting** — charts and trends on the dashboard and processing pages, plus CSV export.
- **Accessibility audit** — the app uses semantic HTML, labeled controls, and visible focus states, but full WCAG conformance would require testing with assistive technology and expert review.
- **Automated tests** — component and flow tests around the payment, refund, and invoice lifecycles.

### How I'd measure success in a real pilot
Merchant activation (first successful payment), time-to-first-payment, checkout completion and payment success rates, retry recovery, connected settlement-account adoption, the share of merchants using the account for more than pass-through settlement, reconciliation completion, and ultimately retention, deposit balances, and risk-adjusted profitability.

---

## Project structure

```
src/
├── components/
│   ├── address/      # Google Places address autocomplete + modal
│   ├── customers/    # Customer form modal, selector
│   ├── dev/          # Dev Controls panel
│   ├── invoices/     # Invoice form modal, email preview
│   ├── layout/       # App shell, sidebar, top bar
│   └── ui/           # Button, Input, Card, Modal, StatusBadge, Toast, etc.
├── context/          # App state (reducer + localStorage), Dev Controls
├── data/             # TypeScript models + seed data
├── hooks/            # useGooglePlaces, useUnsavedChanges
├── pages/            # Dashboard, VirtualTerminal, Transactions, Invoices, etc.
├── utils/            # formatting, invoice helpers, PDF generation, storage
└── styles/           # Tailwind + global CSS
```
