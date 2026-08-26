import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import { useAppState, useAppDispatch } from '@/context/AppStateContext';
import { useDevControls } from '@/context/DevControlsContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { CustomerSelector } from '@/components/customers/CustomerSelector';
import { generateId, formatCurrency } from '@/utils/format';
import type { Transaction } from '@/data/types';

type PaymentState = 'idle' | 'processing' | 'approved' | 'declined' | 'error';

// Card utilities
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
    default: return number.replace(/\D/g, '').length > 0 ? 'Unknown' : '';
  }
}

function shouldDecline(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  return digits.endsWith('0000');
}

function maskCard(number: string): string {
  const digits = number.replace(/\D/g, '');
  return `•••• ${digits.slice(-4)}`;
}

function isExpiryValid(expiry: string): boolean {
  const parts = expiry.split('/');
  if (parts.length !== 2) return false;
  const month = parseInt(parts[0]!, 10);
  const year = parseInt('20' + parts[1]!, 10);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const expDate = new Date(year, month); // first of month after
  return expDate > now;
}

export default function VirtualTerminal() {
  const { merchant } = useAppState();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { state: devControls } = useDevControls();

  // Form state
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [taxEnabled, setTaxEnabled] = useState(merchant.taxConfig.enabledForTerminal);

  // Card state
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  // Tip state
  type TipOption = 'none' | '15' | '18' | '20' | 'custom';
  const [tipOption, setTipOption] = useState<TipOption>('none');
  const [customTip, setCustomTip] = useState('');

  // Payment state
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Computed
  const parsedAmount = parseFloat(amount) || 0;
  const parsedTip = useMemo(() => {
    if (tipOption === 'none') return 0;
    if (tipOption === 'custom') return parseFloat(customTip) || 0;
    const pct = parseInt(tipOption) / 100;
    return Math.round(parsedAmount * pct * 100) / 100;
  }, [tipOption, customTip, parsedAmount]);
  const taxRate = taxEnabled ? merchant.taxConfig.rate : 0;
  const taxAmount = Math.round(parsedAmount * taxRate * 100) / 100;
  const total = parsedAmount + taxAmount + parsedTip;
  const cardBrand = detectCardBrand(cardNumber);

  const canSubmit = useMemo(() => {
    return (
      parsedAmount > 0 &&
      cardholderName.trim().length > 0 &&
      cardNumber.replace(/\D/g, '').length === 16 &&
      expiry.length === 5 &&
      cvv.replace(/\D/g, '').length >= 3 &&
      paymentState === 'idle'
    );
  }, [parsedAmount, cardholderName, cardNumber, expiry, cvv, paymentState]);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (parsedAmount <= 0) newErrors['amount'] = 'Amount must be greater than $0.00.';
    if (parsedAmount > 100000) newErrors['amount'] = 'Amount cannot exceed $100,000.00.';
    if (!cardholderName.trim()) newErrors['cardholderName'] = 'Cardholder name is required.';
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length !== 16) newErrors['cardNumber'] = 'Card number must be 16 digits.';
    if (!isExpiryValid(expiry)) newErrors['expiry'] = 'Enter a valid future expiry (MM/YY).';
    const cvvDigits = cvv.replace(/\D/g, '');
    if (cvvDigits.length < 3 || cvvDigits.length > 4) newErrors['cvv'] = 'CVV must be 3–4 digits.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setPaymentState('processing');

    const delay = devControls.slowNetwork ? 4000 : 1800;

    // Check for forced timeout (Dev Controls)
    if (devControls.forceProcessingTimeout) {
      // Never resolves — user will see spinner indefinitely
      return;
    }

    setTimeout(() => {
      // Dev Controls overrides
      if (devControls.forceGatewayError) {
        setPaymentState('error');
        return;
      }
      if (devControls.forcePaymentDecline || shouldDecline(cardNumber)) {
        setPaymentState('declined');
        return;
      }
      if (devControls.offlineMode) {
        setPaymentState('error');
        return;
      }

      // Approved — create transaction
      const txnId = generateId('txn');
      const transaction: Transaction = {
        id: txnId,
        customerId: customerId,
        type: 'payment',
        source: 'virtual_terminal',
        amount: parsedAmount,
        taxAmount: taxAmount,
        tipAmount: parsedTip,
        total: total,
        status: 'completed',
        paymentMethod: 'card',
        cardBrand: cardBrand || 'Unknown',
        maskedCard: maskCard(cardNumber),
        cardholderName: cardholderName.trim(),
        note: note.trim(),
        createdAt: new Date().toISOString(),
      };

      dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
      setPaymentState('approved');

      // Navigate immediately to receipt — no delay
      navigate(`/terminal/receipt/${txnId}`);
    }, delay);
  }

  function handleRetry() {
    setPaymentState('idle');
    setErrors({});
  }

  function handleCancelTimeout() {
    setPaymentState('idle');
  }

  // Processing overlay
  if (paymentState === 'processing' || paymentState === 'approved') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 size={48} className="animate-spin text-brand-600" />
        <p className="text-lg font-medium text-gray-900">Authorizing payment...</p>
        <p className="text-sm text-gray-500">Please wait while we process this transaction.</p>
        {devControls.forceProcessingTimeout && (
          <Button variant="ghost" size="sm" onClick={handleCancelTimeout} className="mt-4">
            Cancel
          </Button>
        )}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Virtual Terminal</h1>
      <p className="mt-1 text-sm text-gray-500">Process a card payment.</p>

      <form onSubmit={handleSubmit} className="mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Form */}
          <div className="lg:col-span-3 space-y-6">
            {/* Decline / Error messages */}
            {paymentState === 'declined' && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
                <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Payment declined</p>
                  <p className="text-sm text-red-700 mt-0.5">
                    Card ending in {cardNumber.replace(/\D/g, '').slice(-4)} was not approved. No charge was made.
                  </p>
                  <Button variant="ghost" size="sm" onClick={handleRetry} className="mt-2">
                    Try Again
                  </Button>
                </div>
              </div>
            )}

            {paymentState === 'error' && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
                <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Processing error</p>
                  <p className="text-sm text-red-700 mt-0.5">
                    We encountered a processing error. No charge was made. Please try again.
                  </p>
                  <Button variant="ghost" size="sm" onClick={handleRetry} className="mt-2">
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {/* Amount — hero field */}
            <Card>
              <div className="text-center py-4">
                <label htmlFor="amount-input" className="block text-sm font-medium text-gray-500 mb-3">
                  Payment Amount
                </label>
                <div className="relative inline-flex items-baseline">
                  <span className="text-3xl font-light text-gray-400 mr-1">$</span>
                  <input
                    id="amount-input"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="text-5xl font-bold text-gray-900 bg-transparent border-none outline-none text-center w-64 placeholder-gray-300"
                    autoFocus
                  />
                </div>
                {errors['amount'] && (
                  <p className="mt-2 text-sm text-red-600">{errors['amount']}</p>
                )}
                <p className="mt-2 text-xs text-gray-400">USD</p>
              </div>
            </Card>

            {/* Sale Details (note, tax, tip) */}
            <Card>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Sale Details</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                    Note <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value.slice(0, 200))}
                    placeholder="Description of sale..."
                    rows={2}
                    maxLength={200}
                    className="input-field resize-none"
                  />
                  <p className="mt-1 text-xs text-gray-400 text-right">{note.length}/200</p>
                </div>

                {/* Tax */}
                <div>
                  {merchant.taxConfig.enabledForTerminal ? (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={taxEnabled}
                        onChange={(e) => setTaxEnabled(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="text-sm text-gray-700">
                        Apply {merchant.taxConfig.name} ({(merchant.taxConfig.rate * 100).toFixed(2)}%)
                      </span>
                    </label>
                  ) : (
                    <p className="text-sm text-gray-500">Tax is disabled for Virtual Terminal in Settings.</p>
                  )}
                </div>

                {/* Tip selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tip</label>
                  <div className="flex flex-wrap gap-2">
                    <TipButton
                      label="No Tip"
                      active={tipOption === 'none'}
                      onClick={() => { setTipOption('none'); setCustomTip(''); }}
                    />
                    <TipButton
                      label="15%"
                      sublabel={parsedAmount > 0 ? formatCurrency(Math.round(parsedAmount * 0.15 * 100) / 100) : undefined}
                      active={tipOption === '15'}
                      onClick={() => setTipOption('15')}
                    />
                    <TipButton
                      label="18%"
                      sublabel={parsedAmount > 0 ? formatCurrency(Math.round(parsedAmount * 0.18 * 100) / 100) : undefined}
                      active={tipOption === '18'}
                      onClick={() => setTipOption('18')}
                    />
                    <TipButton
                      label="20%"
                      sublabel={parsedAmount > 0 ? formatCurrency(Math.round(parsedAmount * 0.20 * 100) / 100) : undefined}
                      active={tipOption === '20'}
                      onClick={() => setTipOption('20')}
                    />
                    <TipButton
                      label="Other"
                      active={tipOption === 'custom'}
                      onClick={() => setTipOption('custom')}
                    />
                  </div>
                  {tipOption === 'custom' && (
                    <div className="mt-3">
                      <Input
                        label="Custom tip amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={customTip}
                        onChange={(e) => setCustomTip(e.target.value)}
                        placeholder="0.00"
                        helperText="Enter a flat dollar amount"
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Card Details */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Card Details</h3>
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Test mode — no real charges
                </span>
              </div>
              <div className="space-y-4">
                <Input
                  label="Cardholder Name"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  error={errors['cardholderName']}
                  required
                  placeholder="Name on card"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatCardNumber(cardNumber)}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                      className={`input-field pr-20 ${errors['cardNumber'] ? 'input-error' : ''}`}
                      placeholder="4242 4242 4242 4242"
                      inputMode="numeric"
                      autoComplete="off"
                    />
                    {cardBrand && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {cardBrand}
                      </span>
                    )}
                  </div>
                  {errors['cardNumber'] && <p className="mt-1 text-xs text-red-600">{errors['cardNumber']}</p>}
                  <p className="mt-1 text-xs text-gray-400">Cards ending in 0000 will be declined for testing.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiration <span className="text-red-500">*</span>
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVV <span className="text-red-500">*</span>
                    </label>
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
              </div>
            </Card>

            {/* Customer Association — optional, at the bottom */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Associate Customer</h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Optional</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Link this payment to a customer record for tracking. Leave blank for walk-in transactions.
              </p>
              <CustomerSelector value={customerId} onChange={setCustomerId} optional />
            </Card>

            {/* Submit (mobile) */}
            <div className="lg:hidden">
              <Button type="submit" disabled={!canSubmit} className="w-full" size="lg">
                <CreditCard size={18} />
                Process Payment — {formatCurrency(total)}
              </Button>
            </div>
          </div>

          {/* Right: Sale Summary (fixed to viewport, never scrolls) */}
          <div className="lg:col-span-2 hidden lg:block">
            <div className="fixed top-20 right-6 bottom-6 w-[calc((100vw-16rem)*2/5-2rem)]">
              <Card className="h-full flex flex-col">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Sale Summary</h3>
                <div className="flex-1 flex flex-col justify-center space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">{formatCurrency(parsedAmount)}</span>
                  </div>
                  {taxEnabled && parsedAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{merchant.taxConfig.name} ({(merchant.taxConfig.rate * 100).toFixed(2)}%)</span>
                      <span className="text-gray-900">{formatCurrency(taxAmount)}</span>
                    </div>
                  )}
                  {parsedTip > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tip</span>
                      <span className="text-gray-900">{formatCurrency(parsedTip)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-100 pt-3 mt-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-base font-semibold text-gray-900">Total</span>
                      <span className="text-3xl font-bold text-gray-900">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>

                {/* Submit (desktop) */}
                <div className="mt-6">
                  <Button type="submit" disabled={!canSubmit} className="w-full" size="lg">
                    <CreditCard size={18} />
                    Process Payment
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          {/* Mobile: Sale Summary (inline, scrolls with content) */}
          <div className="lg:hidden">
            <Card>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Sale Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(parsedAmount)}</span>
                </div>
                {taxEnabled && parsedAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{merchant.taxConfig.name}</span>
                    <span className="text-gray-900">{formatCurrency(taxAmount)}</span>
                  </div>
                )}
                {parsedTip > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tip</span>
                    <span className="text-gray-900">{formatCurrency(parsedTip)}</span>
                  </div>
                )}
                <div className="border-t border-gray-100 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-gray-900">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

// --- Tip Button ---
function TipButton({
  label,
  sublabel,
  active,
  onClick,
}: {
  label: string;
  sublabel?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center px-4 py-2 rounded-lg border text-sm font-medium transition-colors min-w-[72px] ${
        active
          ? 'bg-brand-50 border-brand-300 text-brand-700 ring-2 ring-brand-200'
          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
      }`}
    >
      <span>{label}</span>
      {sublabel && <span className="text-xs font-normal text-gray-500 mt-0.5">{sublabel}</span>}
    </button>
  );
}
