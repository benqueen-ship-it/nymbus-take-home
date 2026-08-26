import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, RefreshCw, Printer, Mail, Plus, ArrowLeft } from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { useState } from 'react';

export default function PaymentReceipt() {
  const { txnId } = useParams<{ txnId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isHistorical = searchParams.get('source') === 'history';
  const { transactions, customers, merchant, invoices } = useAppState();
  const { toast } = useToast();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [oneTimeEmail, setOneTimeEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const transaction = transactions.find((t) => t.id === txnId);
  const customer = transaction?.customerId
    ? customers.find((c) => c.id === transaction.customerId)
    : null;

  // Find linked invoice if this is an invoice payment
  const linkedInvoice = transaction?.source === 'invoice_payment'
    ? invoices.find((inv) => inv.linkedTransactionId === transaction.id)
    : null;

  // Find original transaction if this is a refund
  const originalTxn = transaction?.linkedTransactionId
    ? transactions.find((t) => t.id === transaction.linkedTransactionId)
    : null;

  if (!transaction) {
    return (
      <EmptyState
        title="Transaction not found"
        description="This transaction doesn't exist."
        action={
          <Button variant="secondary" onClick={() => navigate('/transactions')}>
            Back to Transactions
          </Button>
        }
      />
    );
  }

  const isRefund = transaction.type === 'refund';
  const isInvoicePayment = transaction.source === 'invoice_payment';

  function handlePrint() {
    const printWindow = window.open(window.location.href, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print();
      });
    }
  }

  function handleEmailReceipt() {
    setOneTimeEmail(customer?.email ?? '');
    setEmailError('');
    setShowEmailModal(true);
  }

  function confirmEmailReceipt() {
    const emailToUse = customer?.email || oneTimeEmail.trim();
    if (!emailToUse) {
      setEmailError('Please enter an email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToUse)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    toast(`Receipt sent to ${emailToUse}`);
    setShowEmailModal(false);
    setOneTimeEmail('');
    setEmailError('');
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Success header — only shown for fresh payments, not historical views */}
      {!isHistorical && (
        <div className="text-center mb-6 no-print">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            isRefund ? 'bg-blue-100' : 'bg-green-100'
          }`}>
            {isRefund ? (
              <RefreshCw size={32} className="text-blue-600" />
            ) : (
              <CheckCircle2 size={32} className="text-green-600" />
            )}
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {isRefund ? 'Refund Processed' : 'Payment Approved'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isRefund
              ? 'The refund has been processed successfully.'
              : isInvoicePayment
                ? 'Invoice payment completed successfully.'
                : 'Transaction completed successfully.'}
          </p>
        </div>
      )}

      {/* Receipt card */}
      <Card className="print:shadow-none print:border-none p-6">
        {/* Receipt header */}
        <div className="text-center pb-4 border-b border-gray-100">
          <p className="text-lg font-semibold text-gray-900">{merchant.displayName}</p>
          {merchant.phone && <p className="text-xs text-gray-500">{merchant.phone}</p>}
          {merchant.supportEmail && <p className="text-xs text-gray-500">{merchant.supportEmail}</p>}
          {isRefund && (
            <p className="mt-2 text-sm font-medium text-blue-600 bg-blue-50 inline-block px-3 py-1 rounded-full">
              REFUND RECEIPT
            </p>
          )}
        </div>

        {/* Receipt details */}
        <div className="py-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Transaction ID</span>
            <span className="text-gray-900 font-mono text-xs">{transaction.id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Date & Time</span>
            <span className="text-gray-900">{formatDateTime(transaction.createdAt)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Customer</span>
            <span className="text-gray-900">
              {customer ? `${customer.firstName} ${customer.lastName}` : 'Walk-in Customer'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Type</span>
            <span className="text-gray-900">
              {isRefund ? 'Refund' : isInvoicePayment ? 'Invoice Payment' : 'Payment'}
            </span>
          </div>
          {linkedInvoice && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Invoice</span>
              <span className="text-gray-900">{linkedInvoice.invoiceNumber}</span>
            </div>
          )}
          {isRefund && originalTxn && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Original Transaction</span>
              <span className="text-gray-900 font-mono text-xs">{originalTxn.id}</span>
            </div>
          )}
          {transaction.note && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Note</span>
              <span className="text-gray-900 text-right max-w-[60%]">{transaction.note}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Payment Method</span>
            <span className="text-gray-900">{transaction.cardBrand} {transaction.maskedCard}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Cardholder</span>
            <span className="text-gray-900">{transaction.cardholderName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status</span>
            <StatusBadge status={transaction.status} />
          </div>
        </div>

        {/* Line items */}
        <div className="border-t border-gray-100 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-gray-900">{formatCurrency(Math.abs(transaction.amount))}</span>
          </div>
          {transaction.taxAmount !== 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax</span>
              <span className="text-gray-900">{formatCurrency(Math.abs(transaction.taxAmount))}</span>
            </div>
          )}
          {transaction.tipAmount !== 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tip</span>
              <span className="text-gray-900">{formatCurrency(Math.abs(transaction.tipAmount))}</span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="text-base font-semibold text-gray-900">
                {isRefund ? 'Total Refunded' : 'Total'}
              </span>
              <span className={`text-xl font-bold ${isRefund ? 'text-blue-700' : 'text-gray-900'}`}>
                {isRefund ? '-' : ''}{formatCurrency(Math.abs(transaction.total))}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 mt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {isRefund ? 'Refund processed. Funds will be returned to the original payment method.' : 'Thank you for your business.'}
          </p>
        </div>
      </Card>

      {/* Actions */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center no-print">
        <Button variant="secondary" icon={<Printer size={16} />} onClick={handlePrint}>
          Print Receipt
        </Button>
        <Button variant="secondary" icon={<Mail size={16} />} onClick={handleEmailReceipt}>
          Email Receipt
        </Button>
        <Button icon={<Plus size={16} />} onClick={() => navigate('/terminal')}>
          New Payment
        </Button>
      </div>

      {/* Back link */}
      <div className="mt-4 text-center no-print">
        <Link to={`/transactions/${transaction.id}`} className="text-sm text-gray-500 hover:text-brand-600 inline-flex items-center gap-1">
          <ArrowLeft size={14} />
          Transaction Details
        </Link>
      </div>

      {/* Email confirmation modal */}
      <Modal isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} title="Email Receipt" size="sm">
        {customer ? (
          <p className="text-sm text-gray-600 mb-4">
            Send a copy of this {isRefund ? 'refund receipt' : 'receipt'} to{' '}
            <span className="font-medium">{customer.email}</span>?
          </p>
        ) : (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-3">
              No customer on file. Enter an email address to send the {isRefund ? 'refund receipt' : 'receipt'} to:
            </p>
            <Input
              label="Email Address"
              type="email"
              value={oneTimeEmail}
              onChange={(e) => { setOneTimeEmail(e.target.value); setEmailError(''); }}
              error={emailError}
              placeholder="customer@example.com"
              helperText="This email will not be saved to any customer record."
            />
          </div>
        )}
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setShowEmailModal(false)}>Cancel</Button>
          <Button onClick={confirmEmailReceipt}>
            Send Receipt
          </Button>
        </div>
      </Modal>
    </div>
  );
}
