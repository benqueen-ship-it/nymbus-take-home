import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/utils/format';
import type { Invoice, Customer, MerchantSettings } from '@/data/types';

type EmailTemplate = 'new' | 'overdue' | 'paid' | 'refunded';

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: EmailTemplate;
  invoice: Invoice;
  customer: Customer | null | undefined;
  merchant: MerchantSettings;
  onSend: () => void;
}

export function EmailPreviewModal({ isOpen, onClose, template, invoice, customer, merchant, onSend }: EmailPreviewModalProps) {
  const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'Customer';
  const paymentLink = `${window.location.origin}/pay/${invoice.id}`;

  const templates: Record<EmailTemplate, { subject: string; body: React.ReactNode }> = {
    new: {
      subject: `Invoice ${invoice.invoiceNumber} from ${merchant.displayName}`,
      body: (
        <>
          <p>Hi {customerName},</p>
          <p>You have a new invoice from <strong>{merchant.displayName}</strong>.</p>
          <div className="my-4 p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-gray-500">Amount Due</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(invoice.total)}</p>
            <p className="text-sm text-gray-500 mt-1">Due {formatDate(invoice.dueDate)}</p>
          </div>
          <p className="text-sm text-gray-600">{invoice.description}</p>
        </>
      ),
    },
    overdue: {
      subject: `Reminder: Invoice ${invoice.invoiceNumber} is overdue`,
      body: (
        <>
          <p>Hi {customerName},</p>
          <p>This is a friendly reminder that invoice <strong>{invoice.invoiceNumber}</strong> from <strong>{merchant.displayName}</strong> is now overdue.</p>
          <div className="my-4 p-4 bg-red-50 rounded-lg text-center border border-red-100">
            <p className="text-sm text-red-600">Overdue Amount</p>
            <p className="text-2xl font-bold text-red-700">{formatCurrency(invoice.total)}</p>
            <p className="text-sm text-red-600 mt-1">Was due {formatDate(invoice.dueDate)}</p>
          </div>
          <p className="text-sm text-gray-600">Please submit payment at your earliest convenience.</p>
        </>
      ),
    },
    paid: {
      subject: `Payment received for Invoice ${invoice.invoiceNumber}`,
      body: (
        <>
          <p>Hi {customerName},</p>
          <p>We've received your payment for invoice <strong>{invoice.invoiceNumber}</strong>. Thank you!</p>
          <div className="my-4 p-4 bg-green-50 rounded-lg text-center border border-green-100">
            <p className="text-sm text-green-600">Payment Received</p>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(invoice.total)}</p>
            <p className="text-sm text-green-600 mt-1">Paid in full</p>
          </div>
        </>
      ),
    },
    refunded: {
      subject: `Refund issued for Invoice ${invoice.invoiceNumber}`,
      body: (
        <>
          <p>Hi {customerName},</p>
          <p>A refund has been issued for invoice <strong>{invoice.invoiceNumber}</strong> from <strong>{merchant.displayName}</strong>.</p>
          <div className="my-4 p-4 bg-blue-50 rounded-lg text-center border border-blue-100">
            <p className="text-sm text-blue-600">Refund Amount</p>
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(invoice.total)}</p>
            <p className="text-sm text-blue-600 mt-1">Funds will be returned to your original payment method</p>
          </div>
        </>
      ),
    },
  };

  const { subject, body } = templates[template];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Email Preview" size="lg">
      <div className="space-y-4">
        {/* Email metadata */}
        <div className="text-xs text-gray-500 space-y-1 border-b border-gray-100 pb-3">
          <p><span className="font-medium text-gray-700">To:</span> {customer?.email ?? 'customer@email.com'}</p>
          <p><span className="font-medium text-gray-700">From:</span> {merchant.supportEmail}</p>
          <p><span className="font-medium text-gray-700">Subject:</span> {subject}</p>
        </div>

        {/* Email body preview */}
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden max-w-md mx-auto">
            {/* Header */}
            <div className="p-4 text-center" style={{ backgroundColor: merchant.branding.primaryColor }}>
              <p className="text-white font-semibold text-lg">{merchant.displayName}</p>
            </div>

            {/* Body */}
            <div className="p-6 text-sm text-gray-700 space-y-3">
              {body}
            </div>

            {/* CTA */}
            {(template === 'new' || template === 'overdue') && (
              <div className="px-6 pb-6">
                <div
                  className="w-full py-3 rounded-lg text-center text-white font-medium text-sm"
                  style={{ backgroundColor: merchant.branding.primaryColor }}
                >
                  View and Pay Invoice
                </div>
                <p className="text-[10px] text-gray-400 mt-2 text-center break-all">{paymentLink}</p>
              </div>
            )}

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 text-center">
              <p className="text-xs text-gray-400">{merchant.displayName} • {merchant.phone}</p>
              <p className="text-xs text-gray-400">{merchant.supportEmail}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={onSend}>
            {template === 'overdue' ? 'Send Reminder' : 'Send Email'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
