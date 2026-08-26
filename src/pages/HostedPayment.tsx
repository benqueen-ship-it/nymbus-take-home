import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { useAppState, useAppDispatch } from '@/context/AppStateContext';
import { useDevControls } from '@/context/DevControlsContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency, formatDate } from '@/utils/format';
import { generateId } from '@/utils/format';
import { getEffectiveStatus } from '@/utils/invoice';
import type { Transaction } from '@/data/types';

type PageState = 'form' | 'processing' | 'success' | 'error';

function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length > 2) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
}

function detectCardBrand(number: string): string {
  const first = number.replace(/\D/g, '').charAt(0);
  switch (first) {
    case '4': return 'Visa';
    case '5': return 'Mastercard';
    case '3': return 'Amex';
    case '6': return 'Discover';
    default: return 'Unknown';
  }
}

export default function HostedPayment() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { invoices, customers, merchant } = useAppState();
  const dispatch = useAppDispatch();
  const { state: devControls } = useDevControls();

  const [pageState, setPageState] = useState<PageState>('form');
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const invoice = invoices.find((i) => i.id === invoiceId);
  const customer = invoice ? customers.find((c) => c.id === invoice.customerId) : null;
  const effectiveStatus = invoice ? getEffectiveStatus(invoice) : null;

  // Non-payable states
  if (!invoice) {
    return <HostedMessage merchant={merchant} title="Invoice Not Found" message="This invoice does not exist or the link is invalid." />;
  }
  if (invoice.status === 'paid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full overflow-hidden">
          <div className="p-4 text-center" style={{ backgroundColor: merchant.branding.primaryColor }}>
            <p className="text-white font-semibold">{merchant.displayName}</p>
          </div>
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <CheckCircle2 size={32} className="text-green-600" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Payment Confirmed</h1>
              <p className="text-sm text-gray-500 mt-1">This invoice has been paid. Thank you!</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Invoice</span>
                <span className="text-gray-900 font-medium">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Description</span>
                <span className="text-gray-900 text-right max-w-[60%]">{invoice.description}</span>
              </div>
              {customer && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer</span>
                  <span className="text-gray-900">{customer.firstName} {customer.lastName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Amount Paid</span>
                <span className="text-green-700 font-semibold">{formatCurrency(invoice.total)}</span>
              </div>
              {invoice.paidAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Paid On</span>
                  <span className="text-gray-900">{formatDate(invoice.paidAt.split('T')[0]!)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Due Date</span>
                <span className="text-gray-900">{formatDate(invoice.dueDate)}</span>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-50 text-center border-t border-gray-100">
            <p className="text-xs text-gray-400">Powered by {merchant.displayName}</p>
          </div>
        </div>
      </div>
    );
  }
  if (invoice.status === 'written_off') {
    return <HostedMessage merchant={merchant} title="Invoice Closed" message={`This invoice is no longer payable. Please contact ${merchant.displayName} for assistance.`} />;
  }
  if (invoice.status === 'cancelled') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full overflow-hidden">
          <div className="p-4 text-center" style={{ backgroundColor: merchant.branding.primaryColor }}>
            <p className="text-white font-semibold">{merchant.displayName}</p>
          </div>
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-4">
                <AlertCircle size={32} className="text-orange-600" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Invoice Cancelled</h1>
              <p className="text-sm text-gray-500 mt-1">This invoice has been cancelled. No payment is required.</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Invoice</span>
                <span className="text-gray-900 font-medium">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Description</span>
                <span className="text-gray-900 text-right max-w-[60%]">{invoice.description}</span>
              </div>
              {customer && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer</span>
                  <span className="text-gray-900">{customer.firstName} {customer.lastName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Original Amount</span>
                <span className="text-gray-400 line-through">{formatCurrency(invoice.total)}</span>
              </div>
              {invoice.cancelledAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Cancelled On</span>
                  <span className="text-orange-700 font-medium">{formatDate(invoice.cancelledAt.split('T')[0]!)}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 text-center mt-4">
              If you believe this is an error, please contact {merchant.displayName} at {merchant.supportEmail}.
            </p>
          </div>
          <div className="px-6 py-4 bg-gray-50 text-center border-t border-gray-100">
            <p className="text-xs text-gray-400">Powered by {merchant.displayName}</p>
          </div>
        </div>
      </div>
    );
  }
  if (invoice.status === 'refunded') {
    return <HostedMessage merchant={merchant} title="Invoice Refunded" message={`This invoice was refunded on ${formatDate(invoice.refundedAt!)}. No payment is due.`} />;
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!cardholderName.trim()) newErrors['cardholderName'] = 'Required';
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length !== 16) newErrors['cardNumber'] = 'Must be 16 digits';
    const parts = expiry.split('/');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      newErrors['expiry'] = 'Invalid';
    } else {
      const month = parseInt(parts[0], 10);
      const year = parseInt('20' + parts[1], 10);
      if (month < 1 || month > 12 || new Date(year, month) <= new Date()) {
        newErrors['expiry'] = 'Expired or invalid';
      }
    }
    const cvvDigits = cvv.replace(/\D/g, '');
    if (cvvDigits.length < 3) newErrors['cvv'] = '3-4 digits';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setPageState('processing');

    setTimeout(() => {
      if (devControls.forcePaymentPageError) {
        setPageState('error');
        return;
      }

      // Create transaction
      const txnId = generateId('txn');
      const transaction: Transaction = {
        id: txnId,
        customerId: invoice!.customerId,
        type: 'payment',
        source: 'invoice_payment',
        amount: invoice!.amount,
        taxAmount: invoice!.taxAmount,
        tipAmount: 0,
        total: invoice!.total,
        status: 'completed',
        paymentMethod: 'card',
        cardBrand: detectCardBrand(cardNumber),
        maskedCard: `•••• ${cardNumber.replace(/\D/g, '').slice(-4)}`,
        cardholderName: cardholderName.trim(),
        note: `Payment for ${invoice!.invoiceNumber}`,
        createdAt: new Date().toISOString(),
      };

      dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
      dispatch({
        type: 'UPDATE_INVOICE',
        payload: { id: invoice!.id, updates: { status: 'paid', paidAt: new Date().toISOString(), linkedTransactionId: txnId } },
      });

      setPageState('success');
    }, 2000);
  }

  // Success state — same view as 'paid' status (consistent whether just paid or returning later)
  if (pageState === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full overflow-hidden">
          <div className="p-4 text-center" style={{ backgroundColor: merchant.branding.primaryColor }}>
            <p className="text-white font-semibold">{merchant.displayName}</p>
          </div>
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <CheckCircle2 size={32} className="text-green-600" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Payment Confirmed</h1>
              <p className="text-sm text-gray-500 mt-1">Your payment has been processed successfully. Thank you!</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Invoice</span>
                <span className="text-gray-900 font-medium">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Description</span>
                <span className="text-gray-900 text-right max-w-[60%]">{invoice.description}</span>
              </div>
              {customer && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer</span>
                  <span className="text-gray-900">{customer.firstName} {customer.lastName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Amount Paid</span>
                <span className="text-green-700 font-semibold">{formatCurrency(invoice.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Card</span>
                <span className="text-gray-900">{detectCardBrand(cardNumber)} •••• {cardNumber.replace(/\D/g, '').slice(-4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Due Date</span>
                <span className="text-gray-900">{formatDate(invoice.dueDate)}</span>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-50 text-center border-t border-gray-100">
            <p className="text-xs text-gray-400">Powered by {merchant.displayName}</p>
          </div>
        </div>
      </div>
    );
  }

  // Processing state
  if (pageState === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-brand-600 mx-auto" />
          <p className="text-lg font-medium text-gray-900 mt-4">Processing payment...</p>
          <p className="text-sm text-gray-500 mt-1">Please wait, do not close this page.</p>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full overflow-hidden">
        {/* Branded header */}
        <div className="p-4 text-center" style={{ backgroundColor: merchant.branding.primaryColor }}>
          <p className="text-white font-semibold text-lg">{merchant.displayName}</p>
        </div>

        {/* Invoice summary */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Invoice {invoice.invoiceNumber}</p>
              <p className="text-xs text-gray-400 mt-1">{invoice.description}</p>
              {customer && <p className="text-xs text-gray-400 mt-0.5">{customer.firstName} {customer.lastName}</p>}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(invoice.total)}</p>
              <p className={`text-xs mt-0.5 ${effectiveStatus === 'overdue' ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                {effectiveStatus === 'overdue' ? 'Was due' : 'Due'} {formatDate(invoice.dueDate)}
              </p>
            </div>
          </div>
          {effectiveStatus === 'overdue' && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100">
              <p className="text-sm text-red-700">
                <strong>This invoice is past due.</strong> Please submit your payment at your earliest convenience.
              </p>
            </div>
          )}
        </div>

        {/* Error message */}
        {pageState === 'error' && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-700">Payment could not be processed. Please try again.</p>
              <button onClick={() => setPageState('form')} className="text-xs text-red-600 underline mt-1">Retry</button>
            </div>
          </div>
        )}

        {/* Card form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={14} className="text-gray-400" />
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Test mode — no real charges
            </span>
          </div>

          <Input
            label="Cardholder Name"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            error={errors['cardholderName']}
            required
            placeholder="Name on card"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Card Number <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formatCardNumber(cardNumber)}
              onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
              className={`input-field ${errors['cardNumber'] ? 'input-error' : ''}`}
              placeholder="4242 4242 4242 4242"
              inputMode="numeric"
              autoComplete="off"
            />
            {errors['cardNumber'] && <p className="mt-1 text-xs text-red-600">{errors['cardNumber']}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formatExpiry(expiry)}
                onChange={(e) => setExpiry(e.target.value.replace(/[^\d/]/g, '').slice(0, 5))}
                className={`input-field ${errors['expiry'] ? 'input-error' : ''}`}
                placeholder="MM/YY"
                inputMode="numeric"
                autoComplete="off"
              />
              {errors['expiry'] && <p className="mt-1 text-xs text-red-600">{errors['expiry']}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CVV <span className="text-red-500">*</span></label>
              <input
                type="password"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className={`input-field ${errors['cvv'] ? 'input-error' : ''}`}
                placeholder="•••"
                inputMode="numeric"
                autoComplete="off"
              />
              {errors['cvv'] && <p className="mt-1 text-xs text-red-600">{errors['cvv']}</p>}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            style={{ backgroundColor: merchant.branding.primaryColor }}
          >
            Pay {formatCurrency(invoice.total)}
          </Button>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 text-center border-t border-gray-100">
          <p className="text-xs text-gray-400">Powered by {merchant.displayName}</p>
        </div>
      </div>
    </div>
  );
}

// Reusable message component for non-payable states
function HostedMessage({ merchant, title, message }: { merchant: { displayName: string; branding: { primaryColor: string } }; title: string; message: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full overflow-hidden">
        <div className="p-4 text-center" style={{ backgroundColor: merchant.branding.primaryColor }}>
          <p className="text-white font-semibold">{merchant.displayName}</p>
        </div>
        <div className="p-8 text-center">
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-2">{message}</p>
        </div>
      </div>
    </div>
  );
}
