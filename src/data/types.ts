// ============================================================
// Core Data Models — PayStream POS
// ============================================================

// --- Customer ---
export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// --- Transaction ---
export type TransactionStatus =
  | 'completed'
  | 'pending'
  | 'declined'
  | 'refunded'
  | 'chargeback';

export type TransactionType = 'payment' | 'refund';
export type TransactionSource = 'virtual_terminal' | 'invoice_payment';

export interface Transaction {
  id: string;
  customerId: string | null; // null for anonymous/walk-in
  type: TransactionType;
  source: TransactionSource;
  amount: number; // subtotal
  taxAmount: number;
  tipAmount: number;
  total: number;
  status: TransactionStatus;
  paymentMethod: 'card';
  cardBrand: string; // Visa, Mastercard, Amex, Discover, Unknown
  maskedCard: string; // •••• 1234
  cardholderName: string;
  note: string;
  createdAt: string; // ISO 8601
  refundedAt?: string;
  refundId?: string; // linked refund transaction ID
  linkedTransactionId?: string; // for refund records, points to original
  chargebackReason?: string;
  chargebackAmount?: number;
  chargebackDate?: string;
}

// --- Invoice ---
export type InvoiceStatus =
  | 'draft'
  | 'outstanding'
  | 'overdue' // derived at render time, not stored
  | 'paid'
  | 'written_off'
  | 'cancelled'
  | 'refunded';

export interface Invoice {
  id: string;
  customerId: string;
  invoiceNumber: string; // INV-001
  description: string;
  amount: number; // subtotal
  taxAmount: number;
  total: number;
  status: Exclude<InvoiceStatus, 'overdue'>; // stored status (overdue is derived)
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  sentAt?: string; // ISO 8601
  paidAt?: string;
  refundedAt?: string;
  writtenOffAt?: string;
  cancelledAt?: string;
  lastReminderSentAt?: string;
  linkedTransactionId?: string;
}

// --- Merchant Settings ---
export interface MerchantAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  verified: boolean;
  verifiedAt?: string; // ISO 8601
}

export interface MerchantBranding {
  primaryColor: string; // hex
  secondaryColor: string; // hex
  logoUrl: string; // URL or placeholder identifier
}

export interface TaxConfig {
  name: string; // e.g., "Sales Tax"
  rate: number; // e.g., 0.0825 for 8.25%
  enabledForTerminal: boolean;
  enabledForInvoices: boolean;
}

export interface MerchantSettings {
  legalName: string;
  displayName: string;
  taxId: string;
  website: string;
  phone: string;
  supportEmail: string;
  address: MerchantAddress;
  branding: MerchantBranding;
  taxConfig: TaxConfig;
}

// --- App State ---
export interface AppState {
  merchant: MerchantSettings;
  customers: Customer[];
  transactions: Transaction[];
  invoices: Invoice[];
}

// --- Processing (read-only seeded data) ---
export interface ProcessingStatement {
  id: string;
  month: string; // "July 2026"
  grossVolume: number;
  fees: number;
  net: number;
}

export interface ProcessingDeposit {
  id: string;
  date: string; // YYYY-MM-DD
  status: 'settled' | 'pending' | 'in_transit';
  grossAmount: number;
  fees: number;
  adjustments: number;
  netAmount: number;
  batchTransactions: { id: string; customer: string; amount: number }[];
}

// --- Actions ---
export type AppAction =
  | { type: 'ADD_CUSTOMER'; payload: Customer }
  | { type: 'UPDATE_CUSTOMER'; payload: { id: string; updates: Partial<Customer> } }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: { id: string; updates: Partial<Transaction> } }
  | { type: 'ADD_INVOICE'; payload: Invoice }
  | { type: 'UPDATE_INVOICE'; payload: { id: string; updates: Partial<Invoice> } }
  | { type: 'UPDATE_MERCHANT'; payload: Partial<MerchantSettings> }
  | { type: 'RESET_DATA' };
