import type {
  AppState,
  Customer,
  Transaction,
  Invoice,
  MerchantSettings,
  ProcessingStatement,
  ProcessingDeposit,
} from './types';

// --- Helpers ---
function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function dateStr(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0]!;
}

// --- Merchant ---
const seedMerchant: MerchantSettings = {
  legalName: 'Riverside Services LLC',
  displayName: 'Riverside Services',
  taxId: '82-1234567',
  website: 'https://riversideservices.com',
  phone: '(555) 234-5678',
  supportEmail: 'support@riversideservices.com',
  address: {
    street: '742 Evergreen Terrace',
    city: 'Portland',
    state: 'OR',
    zip: '97201',
    verified: true,
    verifiedAt: daysAgo(30),
  },
  branding: {
    primaryColor: '#0066FF',
    secondaryColor: '#00D4AA',
    logoUrl: '',
  },
  taxConfig: {
    name: 'Sales Tax',
    rate: 0.0825,
    enabledForTerminal: true,
    enabledForInvoices: true,
  },
};

// --- Customers ---
const seedCustomers: Customer[] = [
  { id: 'cust_seed_001', firstName: 'Sarah', lastName: 'Chen', email: 'sarah.chen@email.com', phone: '(555) 100-1001', status: 'active', createdAt: daysAgo(90), updatedAt: daysAgo(5) },
  { id: 'cust_seed_002', firstName: 'Marcus', lastName: 'Johnson', email: 'mjohnson@techcorp.io', phone: '(555) 100-1002', status: 'active', createdAt: daysAgo(80), updatedAt: daysAgo(3) },
  { id: 'cust_seed_003', firstName: 'Emily', lastName: 'Rodriguez', email: 'emily.r@designstudio.co', phone: '(555) 100-1003', status: 'active', createdAt: daysAgo(75), updatedAt: daysAgo(10) },
  { id: 'cust_seed_004', firstName: 'David', lastName: 'Kim', email: 'dkim@kimlaw.com', phone: '(555) 100-1004', status: 'active', createdAt: daysAgo(60), updatedAt: daysAgo(7) },
  { id: 'cust_seed_005', firstName: 'Rachel', lastName: 'Thompson', email: 'rachel.t@greenleaf.org', phone: '(555) 100-1005', status: 'active', createdAt: daysAgo(55), updatedAt: daysAgo(1) },
  { id: 'cust_seed_006', firstName: 'James', lastName: 'Okafor', email: 'james.o@buildrite.com', phone: '(555) 100-1006', status: 'active', createdAt: daysAgo(50), updatedAt: daysAgo(14) },
  { id: 'cust_seed_007', firstName: 'Lisa', lastName: 'Patel', email: 'lisa.patel@cloudworks.io', phone: '(555) 100-1007', status: 'active', createdAt: daysAgo(45), updatedAt: daysAgo(2) },
  { id: 'cust_seed_008', firstName: 'Michael', lastName: 'Torres', email: 'mtorres@bluewave.co', phone: '(555) 100-1008', status: 'inactive', createdAt: daysAgo(40), updatedAt: daysAgo(20) },
  { id: 'cust_seed_009', firstName: 'Amanda', lastName: 'Foster', email: 'amanda.f@sunrisecafe.com', phone: '(555) 100-1009', status: 'active', createdAt: daysAgo(35), updatedAt: daysAgo(4) },
  { id: 'cust_seed_010', firstName: 'Robert', lastName: 'Nakamura', email: 'rnakamura@precisionauto.com', phone: '(555) 100-1010', status: 'active', createdAt: daysAgo(30), updatedAt: daysAgo(6) },
];

// --- Transactions ---
const seedTransactions: Transaction[] = [
  // Completed payments
  { id: 'txn_seed_001', customerId: 'cust_seed_001', type: 'payment', source: 'virtual_terminal', amount: 250.00, taxAmount: 20.63, tipAmount: 0, total: 270.63, status: 'completed', paymentMethod: 'card', cardBrand: 'Visa', maskedCard: '•••• 4242', cardholderName: 'Sarah Chen', note: 'Website redesign consultation', createdAt: daysAgo(2) },
  { id: 'txn_seed_002', customerId: 'cust_seed_002', type: 'payment', source: 'virtual_terminal', amount: 1500.00, taxAmount: 123.75, tipAmount: 50.00, total: 1673.75, status: 'completed', paymentMethod: 'card', cardBrand: 'Mastercard', maskedCard: '•••• 8910', cardholderName: 'Marcus Johnson', note: 'Monthly IT support', createdAt: daysAgo(3) },
  { id: 'txn_seed_003', customerId: 'cust_seed_003', type: 'payment', source: 'invoice_payment', amount: 3200.00, taxAmount: 264.00, tipAmount: 0, total: 3464.00, status: 'completed', paymentMethod: 'card', cardBrand: 'Visa', maskedCard: '•••• 1234', cardholderName: 'Emily Rodriguez', note: 'Brand identity package', createdAt: daysAgo(5) },
  { id: 'txn_seed_004', customerId: 'cust_seed_004', type: 'payment', source: 'virtual_terminal', amount: 450.00, taxAmount: 37.13, tipAmount: 20.00, total: 507.13, status: 'completed', paymentMethod: 'card', cardBrand: 'Amex', maskedCard: '•••• 3456', cardholderName: 'David Kim', note: 'Legal document preparation', createdAt: daysAgo(7) },
  { id: 'txn_seed_005', customerId: 'cust_seed_005', type: 'payment', source: 'virtual_terminal', amount: 85.00, taxAmount: 7.01, tipAmount: 15.00, total: 107.01, status: 'completed', paymentMethod: 'card', cardBrand: 'Visa', maskedCard: '•••• 5678', cardholderName: 'Rachel Thompson', note: 'Garden maintenance', createdAt: daysAgo(8) },
  { id: 'txn_seed_006', customerId: 'cust_seed_006', type: 'payment', source: 'invoice_payment', amount: 4750.00, taxAmount: 391.88, tipAmount: 0, total: 5141.88, status: 'completed', paymentMethod: 'card', cardBrand: 'Mastercard', maskedCard: '•••• 7890', cardholderName: 'James Okafor', note: 'Office renovation phase 1', createdAt: daysAgo(10) },
  { id: 'txn_seed_007', customerId: 'cust_seed_007', type: 'payment', source: 'virtual_terminal', amount: 175.00, taxAmount: 14.44, tipAmount: 25.00, total: 214.44, status: 'completed', paymentMethod: 'card', cardBrand: 'Discover', maskedCard: '•••• 6011', cardholderName: 'Lisa Patel', note: 'Cloud migration consultation', createdAt: daysAgo(12) },
  { id: 'txn_seed_008', customerId: 'cust_seed_009', type: 'payment', source: 'virtual_terminal', amount: 320.00, taxAmount: 26.40, tipAmount: 30.00, total: 376.40, status: 'completed', paymentMethod: 'card', cardBrand: 'Visa', maskedCard: '•••• 9012', cardholderName: 'Amanda Foster', note: 'Catering event planning', createdAt: daysAgo(14) },
  { id: 'txn_seed_009', customerId: 'cust_seed_010', type: 'payment', source: 'virtual_terminal', amount: 890.00, taxAmount: 73.43, tipAmount: 0, total: 963.43, status: 'completed', paymentMethod: 'card', cardBrand: 'Mastercard', maskedCard: '•••• 3456', cardholderName: 'Robert Nakamura', note: 'Full vehicle detailing', createdAt: daysAgo(15) },
  { id: 'txn_seed_010', customerId: 'cust_seed_001', type: 'payment', source: 'virtual_terminal', amount: 150.00, taxAmount: 12.38, tipAmount: 10.00, total: 172.38, status: 'completed', paymentMethod: 'card', cardBrand: 'Visa', maskedCard: '•••• 4242', cardholderName: 'Sarah Chen', note: 'Follow-up session', createdAt: daysAgo(18) },
  { id: 'txn_seed_011', customerId: 'cust_seed_002', type: 'payment', source: 'invoice_payment', amount: 1500.00, taxAmount: 123.75, tipAmount: 0, total: 1623.75, status: 'completed', paymentMethod: 'card', cardBrand: 'Mastercard', maskedCard: '•••• 8910', cardholderName: 'Marcus Johnson', note: 'Monthly IT support - June', createdAt: daysAgo(20) },
  { id: 'txn_seed_012', customerId: null, type: 'payment', source: 'virtual_terminal', amount: 45.00, taxAmount: 3.71, tipAmount: 5.00, total: 53.71, status: 'completed', paymentMethod: 'card', cardBrand: 'Visa', maskedCard: '•••• 1111', cardholderName: 'Walk-in Customer', note: 'Miscellaneous service', createdAt: daysAgo(22) },
  { id: 'txn_seed_013', customerId: 'cust_seed_005', type: 'payment', source: 'virtual_terminal', amount: 95.00, taxAmount: 7.84, tipAmount: 15.00, total: 117.84, status: 'completed', paymentMethod: 'card', cardBrand: 'Amex', maskedCard: '•••• 0005', cardholderName: 'Rachel Thompson', note: 'Lawn care weekly', createdAt: daysAgo(25) },
  { id: 'txn_seed_014', customerId: 'cust_seed_007', type: 'payment', source: 'virtual_terminal', amount: 600.00, taxAmount: 49.50, tipAmount: 0, total: 649.50, status: 'completed', paymentMethod: 'card', cardBrand: 'Visa', maskedCard: '•••• 4567', cardholderName: 'Lisa Patel', note: 'Infrastructure audit', createdAt: daysAgo(28) },
  { id: 'txn_seed_015', customerId: 'cust_seed_009', type: 'payment', source: 'virtual_terminal', amount: 210.00, taxAmount: 17.33, tipAmount: 20.00, total: 247.33, status: 'completed', paymentMethod: 'card', cardBrand: 'Mastercard', maskedCard: '•••• 2222', cardholderName: 'Amanda Foster', note: 'Menu design', createdAt: daysAgo(30) },
  { id: 'txn_seed_016', customerId: 'cust_seed_004', type: 'payment', source: 'invoice_payment', amount: 2100.00, taxAmount: 173.25, tipAmount: 0, total: 2273.25, status: 'completed', paymentMethod: 'card', cardBrand: 'Amex', maskedCard: '•••• 3456', cardholderName: 'David Kim', note: 'Contract review package', createdAt: daysAgo(35) },
  { id: 'txn_seed_017', customerId: 'cust_seed_010', type: 'payment', source: 'virtual_terminal', amount: 550.00, taxAmount: 45.38, tipAmount: 0, total: 595.38, status: 'completed', paymentMethod: 'card', cardBrand: 'Visa', maskedCard: '•••• 7777', cardholderName: 'Robert Nakamura', note: 'Paint correction service', createdAt: daysAgo(40) },
  { id: 'txn_seed_018', customerId: 'cust_seed_003', type: 'payment', source: 'virtual_terminal', amount: 780.00, taxAmount: 64.35, tipAmount: 0, total: 844.35, status: 'completed', paymentMethod: 'card', cardBrand: 'Mastercard', maskedCard: '•••• 9999', cardholderName: 'Emily Rodriguez', note: 'Logo package', createdAt: daysAgo(45) },
  // Pending
  { id: 'txn_seed_019', customerId: 'cust_seed_001', type: 'payment', source: 'virtual_terminal', amount: 300.00, taxAmount: 24.75, tipAmount: 0, total: 324.75, status: 'pending', paymentMethod: 'card', cardBrand: 'Visa', maskedCard: '•••• 4242', cardholderName: 'Sarah Chen', note: 'Pending consultation', createdAt: daysAgo(1) },
  { id: 'txn_seed_020', customerId: 'cust_seed_006', type: 'payment', source: 'invoice_payment', amount: 2200.00, taxAmount: 181.50, tipAmount: 0, total: 2381.50, status: 'pending', paymentMethod: 'card', cardBrand: 'Mastercard', maskedCard: '•••• 7890', cardholderName: 'James Okafor', note: 'Phase 2 deposit', createdAt: daysAgo(1) },
  { id: 'txn_seed_021', customerId: 'cust_seed_007', type: 'payment', source: 'virtual_terminal', amount: 125.00, taxAmount: 10.31, tipAmount: 0, total: 135.31, status: 'pending', paymentMethod: 'card', cardBrand: 'Discover', maskedCard: '•••• 6011', cardholderName: 'Lisa Patel', note: 'Quick security review', createdAt: daysAgo(0) },
  // Declined
  { id: 'txn_seed_022', customerId: 'cust_seed_008', type: 'payment', source: 'virtual_terminal', amount: 400.00, taxAmount: 33.00, tipAmount: 0, total: 433.00, status: 'declined', paymentMethod: 'card', cardBrand: 'Visa', maskedCard: '•••• 0000', cardholderName: 'Michael Torres', note: 'Service quote', createdAt: daysAgo(12) },
  { id: 'txn_seed_023', customerId: null, type: 'payment', source: 'virtual_terminal', amount: 75.00, taxAmount: 6.19, tipAmount: 0, total: 81.19, status: 'declined', paymentMethod: 'card', cardBrand: 'Mastercard', maskedCard: '•••• 0000', cardholderName: 'Anonymous', note: 'Walk-in declined', createdAt: daysAgo(19) },
  // Refunded
  { id: 'txn_seed_024', customerId: 'cust_seed_003', type: 'payment', source: 'virtual_terminal', amount: 500.00, taxAmount: 41.25, tipAmount: 0, total: 541.25, status: 'refunded', paymentMethod: 'card', cardBrand: 'Visa', maskedCard: '•••• 1234', cardholderName: 'Emily Rodriguez', note: 'Logo revision - refunded', createdAt: daysAgo(50), refundedAt: daysAgo(45), refundId: 'txn_seed_025' },
  { id: 'txn_seed_025', customerId: 'cust_seed_003', type: 'refund', source: 'virtual_terminal', amount: -500.00, taxAmount: -41.25, tipAmount: 0, total: -541.25, status: 'completed', paymentMethod: 'card', cardBrand: 'Visa', maskedCard: '•••• 1234', cardholderName: 'Emily Rodriguez', note: 'Refund for txn_seed_024', createdAt: daysAgo(45), linkedTransactionId: 'txn_seed_024' },
  // Chargeback
  { id: 'txn_seed_026', customerId: 'cust_seed_008', type: 'payment', source: 'virtual_terminal', amount: 1200.00, taxAmount: 99.00, tipAmount: 0, total: 1299.00, status: 'chargeback', paymentMethod: 'card', cardBrand: 'Visa', maskedCard: '•••• 8888', cardholderName: 'Michael Torres', note: 'Disputed service delivery', createdAt: daysAgo(55), chargebackReason: 'Unauthorized transaction — cardholder claims they did not authorize this charge', chargebackAmount: 1299.00, chargebackDate: daysAgo(48) },
];

// --- Invoices ---
const seedInvoices: Invoice[] = [
  // Draft
  { id: 'inv_seed_001', customerId: 'cust_seed_005', invoiceNumber: 'INV-001', description: 'Monthly garden maintenance — August', amount: 185.00, taxAmount: 15.26, total: 200.26, status: 'draft', issueDate: dateStr(0), dueDate: dateStr(15) },
  { id: 'inv_seed_002', customerId: 'cust_seed_010', invoiceNumber: 'INV-002', description: 'Ceramic coating application', amount: 1200.00, taxAmount: 99.00, total: 1299.00, status: 'draft', issueDate: dateStr(0), dueDate: dateStr(30) },
  // Outstanding (not overdue)
  { id: 'inv_seed_003', customerId: 'cust_seed_002', invoiceNumber: 'INV-003', description: 'IT support — August retainer', amount: 1500.00, taxAmount: 123.75, total: 1623.75, status: 'outstanding', issueDate: dateStr(-5), dueDate: dateStr(10), sentAt: daysAgo(5) },
  { id: 'inv_seed_004', customerId: 'cust_seed_006', invoiceNumber: 'INV-004', description: 'Office renovation phase 2 — materials', amount: 3800.00, taxAmount: 313.50, total: 4113.50, status: 'outstanding', issueDate: dateStr(-3), dueDate: dateStr(12), sentAt: daysAgo(3) },
  { id: 'inv_seed_005', customerId: 'cust_seed_007', invoiceNumber: 'INV-005', description: 'Cloud infrastructure migration', amount: 2400.00, taxAmount: 198.00, total: 2598.00, status: 'outstanding', issueDate: dateStr(-7), dueDate: dateStr(7), sentAt: daysAgo(7) },
  // Overdue (outstanding but past due date)
  { id: 'inv_seed_006', customerId: 'cust_seed_004', invoiceNumber: 'INV-006', description: 'Legal consultation — estate planning', amount: 950.00, taxAmount: 78.38, total: 1028.38, status: 'outstanding', issueDate: dateStr(-25), dueDate: dateStr(-5), sentAt: daysAgo(25) },
  { id: 'inv_seed_007', customerId: 'cust_seed_009', invoiceNumber: 'INV-007', description: 'Catering for corporate event', amount: 2800.00, taxAmount: 231.00, total: 3031.00, status: 'outstanding', issueDate: dateStr(-20), dueDate: dateStr(-3), sentAt: daysAgo(20), lastReminderSentAt: daysAgo(2) },
  // Paid
  { id: 'inv_seed_008', customerId: 'cust_seed_003', invoiceNumber: 'INV-008', description: 'Brand identity package — final payment', amount: 3200.00, taxAmount: 264.00, total: 3464.00, status: 'paid', issueDate: dateStr(-30), dueDate: dateStr(-15), sentAt: daysAgo(30), paidAt: daysAgo(5), linkedTransactionId: 'txn_seed_003' },
  { id: 'inv_seed_009', customerId: 'cust_seed_004', invoiceNumber: 'INV-009', description: 'Contract review — Wilson case', amount: 2100.00, taxAmount: 173.25, total: 2273.25, status: 'paid', issueDate: dateStr(-45), dueDate: dateStr(-30), sentAt: daysAgo(45), paidAt: daysAgo(35), linkedTransactionId: 'txn_seed_016' },
  // Written Off
  { id: 'inv_seed_010', customerId: 'cust_seed_008', invoiceNumber: 'INV-010', description: 'Service agreement — Q2', amount: 800.00, taxAmount: 66.00, total: 866.00, status: 'written_off', issueDate: dateStr(-60), dueDate: dateStr(-45), sentAt: daysAgo(60), writtenOffAt: daysAgo(30) },
];

// --- Processing Data (static, read-only) ---
export const seedStatements: ProcessingStatement[] = [
  { id: 'stmt_001', month: 'July 2026', grossVolume: 28450.00, fees: 854.35, net: 27595.65 },
  { id: 'stmt_002', month: 'June 2026', grossVolume: 31200.00, fees: 935.10, net: 30264.90 },
  { id: 'stmt_003', month: 'May 2026', grossVolume: 25800.00, fees: 778.52, net: 25021.48 },
];

export const seedDeposits: ProcessingDeposit[] = [
  { id: 'dep_001', date: dateStr(-1), status: 'pending', grossAmount: 2945.38, fees: 88.61, adjustments: 0, netAmount: 2856.77, batchTransactions: [{ id: 'txn_seed_001', customer: 'Sarah Chen', amount: 270.63 }, { id: 'txn_seed_002', customer: 'Marcus Johnson', amount: 1673.75 }, { id: 'txn_seed_021', customer: 'Lisa Patel', amount: 135.31 }] },
  { id: 'dep_002', date: dateStr(-3), status: 'in_transit', grossAmount: 3464.00, fees: 100.76, adjustments: 0, netAmount: 3363.24, batchTransactions: [{ id: 'txn_seed_003', customer: 'Emily Rodriguez', amount: 3464.00 }] },
  { id: 'dep_003', date: dateStr(-5), status: 'settled', grossAmount: 5648.01, fees: 164.49, adjustments: 0, netAmount: 5483.52, batchTransactions: [{ id: 'txn_seed_004', customer: 'David Kim', amount: 507.13 }, { id: 'txn_seed_005', customer: 'Rachel Thompson', amount: 107.01 }, { id: 'txn_seed_006', customer: 'James Okafor', amount: 5141.88 }] },
  { id: 'dep_004', date: dateStr(-8), status: 'settled', grossAmount: 590.84, fees: 17.93, adjustments: 0, netAmount: 572.91, batchTransactions: [{ id: 'txn_seed_007', customer: 'Lisa Patel', amount: 214.44 }, { id: 'txn_seed_008', customer: 'Amanda Foster', amount: 376.40 }] },
  { id: 'dep_005', date: dateStr(-12), status: 'settled', grossAmount: 963.43, fees: 28.24, adjustments: 0, netAmount: 935.19, batchTransactions: [{ id: 'txn_seed_009', customer: 'Robert Nakamura', amount: 963.43 }] },
  { id: 'dep_006', date: dateStr(-15), status: 'settled', grossAmount: 1795.13, fees: 52.66, adjustments: -541.25, netAmount: 1201.22, batchTransactions: [{ id: 'txn_seed_010', customer: 'Sarah Chen', amount: 172.38 }, { id: 'txn_seed_011', customer: 'Marcus Johnson', amount: 1623.75 }, { id: 'txn_seed_025', customer: 'Emily Rodriguez (Refund)', amount: -541.25 }] },
];

// --- Generator ---
export function generateSeedData(): AppState {
  return {
    merchant: seedMerchant,
    customers: seedCustomers,
    transactions: seedTransactions,
    invoices: seedInvoices,
  };
}
