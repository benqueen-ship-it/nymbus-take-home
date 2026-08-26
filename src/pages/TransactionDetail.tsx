import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertTriangle, FileText } from 'lucide-react';
import { useAppState, useAppDispatch } from '@/context/AppStateContext';
import { useDevControls } from '@/context/DevControlsContext';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, formatDateTime, formatDate } from '@/utils/format';
import { generateId } from '@/utils/format';
import type { Transaction } from '@/data/types';

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { transactions, customers } = useAppState();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { state: devControls } = useDevControls();

  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundProcessing, setRefundProcessing] = useState(false);

  const transaction = transactions.find((t) => t.id === id);
  const customer = transaction?.customerId
    ? customers.find((c) => c.id === transaction.customerId)
    : null;

  // Linked transactions
  const refundRecord = transaction?.refundId
    ? transactions.find((t) => t.id === transaction.refundId)
    : null;
  const originalTxn = transaction?.linkedTransactionId
    ? transactions.find((t) => t.id === transaction.linkedTransactionId)
    : null;

  if (!transaction) {
    return (
      <EmptyState
        title="Transaction not found"
        description="This transaction doesn't exist or has been removed."
        action={
          <Button variant="secondary" onClick={() => navigate('/transactions')}>
            Back to Transactions
          </Button>
        }
      />
    );
  }

  const isRefundable = transaction.status === 'completed' && transaction.type === 'payment';
  const hasReceipt = transaction.status === 'completed' || transaction.status === 'refunded' || transaction.status === 'pending';

  function getSourceLabel(source: string): string {
    return source === 'virtual_terminal' ? 'Virtual Terminal' : 'Invoice Payment';
  }

  function handleRefund() {
    if (!transaction) return;
    const txn = transaction;
    setRefundProcessing(true);

    const delay = devControls.slowNetwork ? 4000 : 1200;

    setTimeout(() => {
      if (devControls.forceRefundFailure) {
        setRefundProcessing(false);
        setShowRefundModal(false);
        toast('Refund could not be processed. Please try again.', 'error');
        return;
      }

      // Create refund transaction
      const refundId = generateId('txn');
      const refundTxn: Transaction = {
        id: refundId,
        customerId: txn.customerId,
        type: 'refund',
        source: txn.source,
        amount: -txn.amount,
        taxAmount: -txn.taxAmount,
        tipAmount: -txn.tipAmount,
        total: -txn.total,
        status: 'completed',
        paymentMethod: 'card',
        cardBrand: txn.cardBrand,
        maskedCard: txn.maskedCard,
        cardholderName: txn.cardholderName,
        note: `Refund for ${txn.id}`,
        createdAt: new Date().toISOString(),
        linkedTransactionId: txn.id,
      };

      dispatch({ type: 'ADD_TRANSACTION', payload: refundTxn });

      // Update original transaction
      dispatch({
        type: 'UPDATE_TRANSACTION',
        payload: {
          id: txn.id,
          updates: {
            status: 'refunded',
            refundedAt: new Date().toISOString(),
            refundId: refundId,
          },
        },
      });

      setRefundProcessing(false);
      setShowRefundModal(false);
      toast('Refund processed successfully');
    }, delay);
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link to="/transactions" className="hover:text-brand-600 flex items-center gap-1">
          <ArrowLeft size={14} />
          Transactions
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-mono text-xs">{transaction.id}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">
              {transaction.type === 'refund' ? 'Refund' : 'Payment'} — {formatCurrency(Math.abs(transaction.total))}
            </h1>
            <StatusBadge status={transaction.status} size="md" />
          </div>
          <p className="text-sm text-gray-500 mt-1">{formatDateTime(transaction.createdAt)}</p>
        </div>
        {(isRefundable || hasReceipt) && (
          <div className="flex items-center gap-2">
            {hasReceipt && (
              <Button
                variant="secondary"
                icon={<FileText size={16} />}
                onClick={() => navigate(`/receipt/${transaction.id}?source=history`)}
              >
                View Receipt
              </Button>
            )}
            {isRefundable && (
              <Button
                variant="danger"
                icon={<RefreshCw size={16} />}
                onClick={() => setShowRefundModal(true)}
              >
                Refund Payment
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
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
                <Link to={`/customers/${customer.id}`} className="text-sm text-brand-600 hover:underline">
                  View Customer
                </Link>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Walk-in Customer — no customer record associated.</p>
            )}
          </Card>

          {/* Sale Details */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Sale Details</h3>
            <div className="space-y-2">
              {transaction.note && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Note</span>
                  <span className="text-gray-900 text-right max-w-[60%]">{transaction.note}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Source</span>
                <span className="text-gray-900">{getSourceLabel(transaction.source)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date</span>
                <span className="text-gray-900">{formatDateTime(transaction.createdAt)}</span>
              </div>
            </div>

            {/* Line items */}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
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
              <div className="flex justify-between text-sm font-semibold border-t border-gray-100 pt-2">
                <span className="text-gray-900">Total</span>
                <span className={transaction.type === 'refund' ? 'text-red-600' : 'text-gray-900'}>
                  {transaction.type === 'refund' ? '-' : ''}{formatCurrency(Math.abs(transaction.total))}
                </span>
              </div>
            </div>
          </Card>

          {/* Payment Method */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Method</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Card Brand</span>
                <span className="text-gray-900">{transaction.cardBrand}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Card Number</span>
                <span className="text-gray-900 font-mono">{transaction.maskedCard}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Cardholder</span>
                <span className="text-gray-900">{transaction.cardholderName}</span>
              </div>
            </div>
          </Card>

          {/* Refund Info (if refunded) */}
          {transaction.status === 'refunded' && refundRecord && (
            <Card>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Refund Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Refund ID</span>
                  <Link to={`/transactions/${refundRecord.id}`} className="text-brand-600 hover:underline font-mono text-xs">
                    {refundRecord.id}
                  </Link>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Refund Date</span>
                  <span className="text-gray-900">{formatDateTime(refundRecord.createdAt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Amount Refunded</span>
                  <span className="text-red-600 font-medium">{formatCurrency(Math.abs(refundRecord.total))}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Original Transaction (if this is a refund record) */}
          {transaction.type === 'refund' && originalTxn && (
            <Card>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Original Transaction</h3>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-gray-900">{formatCurrency(originalTxn.total)} — {originalTxn.note || 'Payment'}</p>
                  <p className="text-xs text-gray-500">{formatDateTime(originalTxn.createdAt)}</p>
                </div>
                <Link to={`/transactions/${originalTxn.id}`} className="text-sm text-brand-600 hover:underline">
                  View Original
                </Link>
              </div>
            </Card>
          )}

          {/* Chargeback Info */}
          {transaction.status === 'chargeback' && (
            <Card>
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Chargeback Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Reason</span>
                      <span className="text-gray-900 text-right max-w-[60%]">{transaction.chargebackReason}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Disputed Amount</span>
                      <span className="text-red-600 font-medium">{formatCurrency(transaction.chargebackAmount ?? 0)}</span>
                    </div>
                    {transaction.chargebackDate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Chargeback Filed</span>
                        <span className="text-gray-900">{formatDate(transaction.chargebackDate)}</span>
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    Dispute response workflows are not available in this prototype.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right column — Status Timeline */}
        <div className="lg:col-span-1">
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Status History</h3>
            <div className="space-y-0">
              <TimelineEntry
                status="Created"
                date={transaction.createdAt}
                color="gray"
                isFirst
              />
              {(transaction.status === 'completed' || transaction.status === 'refunded') && (
                <TimelineEntry
                  status="Completed"
                  date={transaction.createdAt}
                  color="green"
                />
              )}
              {transaction.status === 'refunded' && transaction.refundedAt && (
                <TimelineEntry
                  status="Refunded"
                  date={transaction.refundedAt}
                  color="blue"
                  isLast
                />
              )}
              {transaction.status === 'declined' && (
                <TimelineEntry
                  status="Declined"
                  date={transaction.createdAt}
                  color="red"
                  isLast
                />
              )}
              {transaction.status === 'chargeback' && transaction.chargebackDate && (
                <TimelineEntry
                  status="Chargeback Filed"
                  date={transaction.chargebackDate}
                  color="purple"
                  isLast
                />
              )}
              {transaction.status === 'pending' && (
                <TimelineEntry
                  status="Pending"
                  date={transaction.createdAt}
                  color="yellow"
                  isLast
                />
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Refund Confirmation Modal */}
      <Modal
        isOpen={showRefundModal}
        onClose={() => !refundProcessing && setShowRefundModal(false)}
        title="Refund Payment"
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Transaction</span>
              <span className="text-gray-900 font-mono text-xs">{transaction.id.slice(0, 16)}...</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Customer</span>
              <span className="text-gray-900">
                {customer ? `${customer.firstName} ${customer.lastName}` : 'Walk-in Customer'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Card</span>
              <span className="text-gray-900">{transaction.cardBrand} {transaction.maskedCard}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-gray-900">Refund Amount</span>
              <span className="text-red-600">{formatCurrency(transaction.total)}</span>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            This will issue a full refund of {formatCurrency(transaction.total)} to the customer's card ending in {transaction.maskedCard.slice(-4)}. This action cannot be undone.
          </p>

          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowRefundModal(false)} disabled={refundProcessing}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleRefund} loading={refundProcessing}>
              Confirm Refund
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// --- Timeline Entry ---
function TimelineEntry({
  status,
  date,
  color,
  isFirst = false,
  isLast = false,
}: {
  status: string;
  date: string;
  color: string;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const dotColors: Record<string, string> = {
    gray: 'bg-gray-400',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
  };

  return (
    <div className="flex gap-3">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        {!isFirst && <div className="w-px h-3 bg-gray-200" />}
        <div className={`w-3 h-3 rounded-full shrink-0 ${dotColors[color] ?? 'bg-gray-400'}`} />
        {!isLast && <div className="w-px flex-1 bg-gray-200" />}
      </div>
      {/* Content */}
      <div className="pb-4">
        <p className="text-sm font-medium text-gray-900">{status}</p>
        <p className="text-xs text-gray-500">{formatDateTime(date)}</p>
      </div>
    </div>
  );
}
