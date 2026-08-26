import type { Invoice, InvoiceStatus } from '@/data/types';

/**
 * Derives the effective display status of an invoice.
 * An outstanding invoice becomes "overdue" if today is past the due date.
 * The actual stored status remains 'outstanding' — overdue is render-time only.
 */
export function getEffectiveStatus(invoice: Invoice): InvoiceStatus {
  if (invoice.status === 'outstanding') {
    const today = new Date().toISOString().split('T')[0]!;
    if (invoice.dueDate < today) return 'overdue';
  }
  return invoice.status;
}

/**
 * Generate the next invoice number based on existing invoices.
 */
export function generateInvoiceNumber(existingInvoices: Invoice[]): string {
  const maxNumber = existingInvoices.reduce((max, inv) => {
    const num = parseInt(inv.invoiceNumber.replace('INV-', ''), 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
  return `INV-${String(maxNumber + 1).padStart(3, '0')}`;
}
