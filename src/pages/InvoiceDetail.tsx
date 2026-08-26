import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Bell, XCircle, RefreshCw, ExternalLink, Ban } from 'lucide-react';
import { useAppState, useAppDispatch } from '@/context/AppStateContext';
import { useDevControls } from '@/context/DevControlsContext';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';
import { generateId } from '@/utils/format';
import { getEffectiveStatus } from '@/utils/invoice';
import { EmailPreviewModal } from '@/components/invoices/EmailPreviewModal';
import type { Transaction } from '@/data/types';

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { invoices, customers, transactions, merchant } = useAppState();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { state: devControls } = useDevControls();

  const [showWriteOffModal, setShowWriteOffModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [refundProcessing, setRefundProcessing] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState<'new' | 'overdue' | 'paid' | 'refunded' | null>(null);

  const invoice = invoices.find((i) => i.id === id);
  const customer = invoice ? customers.find((c) => c.id === invoice.customerId) : null;
  const linkedTxn = invoice?.linkedTransactionId
    ? transactions.find((t) => t.id === invoice.linkedTransactionId)
    : null;

  if (!invoice) {
    return (
      <EmptyState
        title="Invoice not found"
        description="This invoice doesn't exist."
        action={<Button variant="secondary" onClick={() => navigate('/invoices')}>Back to Invoices</Button>}
      />
    );
  }

  const effectiveStatus = getEffectiveStatus(invoice);
  const isOverdue = effectiveStatus === 'overdue';
  const paymentLink = `${window.location.origin}/pay/${invoice.id}`;

  function handleSendInvoice() {
    setEmailTemplate('new');
  }

  function confirmSendInvoice() {
    if (devControls.forceSendFailure) {
      toast('Failed to send invoice. Please try again.', 'error');
      setEmailTemplate(null);
      return;
    }
    dispatch({
      type: 'UPDATE_INVOICE',
      payload: { id: invoice!.id, updates: { status: 'outstanding', sentAt: new Date().toISOString() } },
    });
    toast(`Invoice sent to ${customer?.email ?? 'customer'}`);
    setEmailTemplate(null);
  }

  function handleSendReminder() {
    setEmailTemplate('overdue');
  }

  function confirmSendReminder() {
    dispatch({
      type: 'UPDATE_INVOICE',
      payload: { id: invoice!.id, updates: { lastReminderSentAt: new Date().toISOString() } },
    });
    toast('Reminder sent');
    setEmailTemplate(null);
  }

  function handleWriteOff() {
    dispatch({
      type: 'UPDATE_INVOICE',
      payload: { id: invoice!.id, updates: { status: 'written_off', writtenOffAt: new Date().toISOString() } },
    });
    toast('Invoice written off');
    setShowWriteOffModal(false);
  }

  function handleCancel() {
    dispatch({
      type: 'UPDATE_INVOICE',
      payload: { id: invoice!.id, updates: { status: 'cancelled', cancelledAt: new Date().toISOString() } },
    });
    toast('Invoice cancelled');
    setShowCancelModal(false);
  }

  function handleRefund() {
    setRefundProcessing(true);
    setTimeout(() => {
      if (devControls.forceRefundFailure) {
        toast('Refund could not be processed.', 'error');
        setRefundProcessing(false);
        setShowRefundModal(false);
        return;
      }

      const refundId = generateId('txn');
      const refundTxn: Transaction = {
        id: refundId,
        customerId: invoice!.customerId,
        type: 'refund',
        source: 'invoice_payment',
        amount: -invoice!.amount,
        taxAmount: -invoice!.taxAmount,
        tipAmount: 0,
        total: -invoice!.total,
        status: 'completed',
        paymentMethod: 'card',
        cardBrand: linkedTxn?.cardBrand ?? 'Visa',
        maskedCard: linkedTxn?.maskedCard ?? '•••• 0000',
        cardholderName: linkedTxn?.cardholderName ?? (customer ? `${customer.firstName} ${customer.lastName}` : 'Customer'),
        note: `Refund for ${invoice!.invoiceNumber}`,
        createdAt: new Date().toISOString(),
        linkedTransactionId: invoice!.linkedTransactionId ?? undefined,
      };

      dispatch({ type: 'ADD_TRANSACTION', payload: refundTxn });

      if (invoice!.linkedTransactionId) {
        dispatch({
          type: 'UPDATE_TRANSACTION',
          payload: { id: invoice!.linkedTransactionId, updates: { status: 'refunded', refundedAt: new Date().toISOString(), refundId } },
        });
      }

      dispatch({
        type: 'UPDATE_INVOICE',
        payload: { id: invoice!.id, updates: { status: 'refunded', refundedAt: new Date().toISOString() } },
      });

      toast('Invoice payment refunded');
      setRefundProcessing(false);
      setShowRefundModal(false);
    }, 1200);
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link to="/invoices" className="hover:text-brand-600 flex items-center gap-1">
          <ArrowLeft size={14} /> Invoices
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{invoice.invoiceNumber}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">{invoice.invoiceNumber}</h1>
            <StatusBadge status={effectiveStatus} size="md" />
          </div>
          <p className="text-sm text-gray-500 mt-1">{invoice.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {invoice.status === 'draft' && (
            <>
              <Button icon={<Send size={14} />} size="sm" onClick={handleSendInvoice}>Send Invoice</Button>
              <Button variant="ghost" icon={<Ban size={14} />} size="sm" onClick={() => setShowCancelModal(true)}>Cancel</Button>
            </>
          )}
          {isOverdue && (
            <Button variant="secondary" icon={<Bell size={14} />} size="sm" onClick={handleSendReminder}>Send Reminder</Button>
          )}
          {(invoice.status === 'outstanding') && (
            <>
              <Button variant="secondary" icon={<Send size={14} />} size="sm" onClick={handleSendInvoice}>Re-send</Button>
              <Button variant="ghost" icon={<XCircle size={14} />} size="sm" onClick={() => setShowWriteOffModal(true)}>Write Off</Button>
              <Button variant="ghost" icon={<Ban size={14} />} size="sm" onClick={() => setShowCancelModal(true)}>Cancel</Button>
            </>
          )}
          {invoice.status === 'paid' && (
            <Button variant="danger" icon={<RefreshCw size={14} />} size="sm" onClick={() => setShowRefundModal(true)}>Refund Payment</Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Customer</h3>
            {customer ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{customer.firstName} {customer.lastName}</p>
                  <p className="text-sm text-gray-500">{customer.email}</p>
                </div>
                <Link to={`/customers/${customer.id}`} className="text-sm text-brand-600 hover:underline">View</Link>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Customer not found.</p>
            )}
          </Card>

          {/* Invoice Details */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Invoice Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Invoice Number</span>
                <span className="text-gray-900 font-medium">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Issue Date</span>
                <span className="text-gray-900">{formatDate(invoice.issueDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Due Date</span>
                <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}>{formatDate(invoice.dueDate)}</span>
              </div>
              {invoice.sentAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Sent</span>
                  <span className="text-gray-900">{formatDateTime(invoice.sentAt)}</span>
                </div>
              )}
              {invoice.paidAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Paid</span>
                  <span className="text-green-700 font-medium">{formatDateTime(invoice.paidAt)}</span>
                </div>
              )}
              {invoice.lastReminderSentAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Last Reminder</span>
                  <span className="text-gray-900">{formatDateTime(invoice.lastReminderSentAt)}</span>
                </div>
              )}
            </div>

            {/* Amounts */}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">{formatCurrency(invoice.amount)}</span>
              </div>
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">{formatCurrency(invoice.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold border-t border-gray-100 pt-2">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </Card>

          {/* Linked Transaction */}
          {linkedTxn && (
            <Card>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Transaction</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-900">{formatCurrency(linkedTxn.total)} — {linkedTxn.cardBrand} {linkedTxn.maskedCard}</p>
                  <p className="text-xs text-gray-500">{formatDateTime(linkedTxn.createdAt)}</p>
                </div>
                <Link to={`/transactions/${linkedTxn.id}`} className="text-sm text-brand-600 hover:underline">View Transaction</Link>
              </div>
            </Card>
          )}

          {/* Payment Link */}
          {(invoice.status === 'outstanding' || invoice.status === 'draft' || invoice.status === 'cancelled') && (
            <Card>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Link</h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={paymentLink}
                  className="input-field text-xs font-mono flex-1"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <a href={paymentLink} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <Button variant="ghost" size="sm" icon={<ExternalLink size={14} />}>Open</Button>
                </a>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {invoice.status === 'cancelled'
                  ? 'This link shows the cancelled status to anyone who visits it.'
                  : 'Share this link with your customer to collect payment.'}
              </p>
            </Card>
          )}
        </div>

        {/* Right column — Status (appears after Invoice Details on mobile) */}
        <div className="space-y-6 order-first lg:order-none lg:col-span-1">
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              {invoice.status === 'paid' ? 'Amount Paid' : invoice.status === 'cancelled' ? 'Amount (Cancelled)' : 'Amount Due'}
            </h3>
            <p className={`text-3xl font-bold ${
              isOverdue ? 'text-red-700' 
              : invoice.status === 'paid' ? 'text-green-700' 
              : invoice.status === 'cancelled' ? 'text-gray-400 line-through'
              : 'text-gray-900'
            }`}>
              {formatCurrency(invoice.total)}
            </p>
            {isOverdue && (
              <p className="text-sm text-red-600 mt-1">
                Overdue by {Math.floor((Date.now() - new Date(invoice.dueDate).getTime()) / 86400000)} days
              </p>
            )}
            {invoice.status === 'cancelled' && invoice.cancelledAt && (
              <p className="text-sm text-orange-600 mt-1">
                Cancelled on {formatDate(invoice.cancelledAt.split('T')[0]!)}
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* Write Off Modal */}
      <Modal isOpen={showWriteOffModal} onClose={() => setShowWriteOffModal(false)} title="Write Off Invoice" size="sm">
        <p className="text-sm text-gray-600 mb-4">
          Write off {invoice.invoiceNumber} for {formatCurrency(invoice.total)}? This action cannot be undone. The invoice will be marked as written off and no payment will be collected.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setShowWriteOffModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleWriteOff}>Write Off</Button>
        </div>
      </Modal>

      {/* Cancel Invoice Modal */}
      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancel Invoice" size="sm">
        <p className="text-sm text-gray-600 mb-4">
          Cancel {invoice.invoiceNumber} for {formatCurrency(invoice.total)}? The invoice will be marked as cancelled and no payment will be collected. This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>Keep Invoice</Button>
          <Button variant="danger" onClick={handleCancel}>Cancel Invoice</Button>
        </div>
      </Modal>

      {/* Refund Modal */}
      <Modal isOpen={showRefundModal} onClose={() => !refundProcessing && setShowRefundModal(false)} title="Refund Invoice Payment" size="sm">
        <p className="text-sm text-gray-600 mb-4">
          Issue a full refund of {formatCurrency(invoice.total)} for {invoice.invoiceNumber}? This will create a refund transaction and mark the invoice as refunded.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setShowRefundModal(false)} disabled={refundProcessing}>Cancel</Button>
          <Button variant="danger" onClick={handleRefund} loading={refundProcessing}>Confirm Refund</Button>
        </div>
      </Modal>

      {/* Email Preview */}
      <EmailPreviewModal
        isOpen={emailTemplate !== null}
        onClose={() => setEmailTemplate(null)}
        template={emailTemplate ?? 'new'}
        invoice={invoice}
        customer={customer}
        merchant={merchant}
        onSend={emailTemplate === 'overdue' ? confirmSendReminder : confirmSendInvoice}
      />
    </div>
  );
}
