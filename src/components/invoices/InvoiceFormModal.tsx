import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAppState, useAppDispatch } from '@/context/AppStateContext';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CustomerSelector } from '@/components/customers/CustomerSelector';
import { generateId, formatCurrency } from '@/utils/format';
import { generateInvoiceNumber } from '@/utils/invoice';
import type { Invoice, Customer } from '@/data/types';

interface InvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCustomerId?: string;
}

type ModalView = 'invoice' | 'new-customer';

export function InvoiceFormModal({ isOpen, onClose, preselectedCustomerId }: InvoiceFormModalProps) {
  const { invoices, customers, merchant } = useAppState();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [view, setView] = useState<ModalView>('invoice');

  // Invoice form state
  const [customerId, setCustomerId] = useState<string | null>(preselectedCustomerId ?? null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [taxEnabled, setTaxEnabled] = useState(merchant.taxConfig.enabledForInvoices);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]!);
  const [dueDate, setDueDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Customer form state
  const [custFirstName, setCustFirstName] = useState('');
  const [custLastName, setCustLastName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custErrors, setCustErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setView('invoice');
      setCustomerId(preselectedCustomerId ?? null);
      setDescription('');
      setAmount('');
      setTaxEnabled(merchant.taxConfig.enabledForInvoices);
      setIssueDate(new Date().toISOString().split('T')[0]!);
      setDueDate('');
      setErrors({});
      resetCustomerForm();
    }
  }, [isOpen, preselectedCustomerId, merchant.taxConfig.enabledForInvoices]);

  function resetCustomerForm() {
    setCustFirstName('');
    setCustLastName('');
    setCustEmail('');
    setCustPhone('');
    setCustErrors({});
  }

  const parsedAmount = parseFloat(amount) || 0;
  const taxRate = taxEnabled ? merchant.taxConfig.rate : 0;
  const taxAmount = Math.round(parsedAmount * taxRate * 100) / 100;
  const total = parsedAmount + taxAmount;

  // --- Invoice validation ---
  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!customerId) newErrors['customer'] = 'Please select a customer.';
    if (!description.trim()) newErrors['description'] = 'Description is required.';
    if (parsedAmount <= 0) newErrors['amount'] = 'Amount must be greater than $0.00.';
    if (parsedAmount > 100000) newErrors['amount'] = 'Amount cannot exceed $100,000.00.';
    if (!dueDate) newErrors['dueDate'] = 'Due date is required.';
    else if (dueDate < issueDate) newErrors['dueDate'] = 'Due date must be on or after issue date.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSave(status: 'draft' | 'outstanding') {
    if (!validate()) return;
    setSaving(true);

    setTimeout(() => {
      const invoiceNumber = generateInvoiceNumber(invoices);
      const newInvoice: Invoice = {
        id: generateId('inv'),
        customerId: customerId!,
        invoiceNumber,
        description: description.trim(),
        amount: parsedAmount,
        taxAmount,
        total,
        status,
        issueDate,
        dueDate,
        sentAt: status === 'outstanding' ? new Date().toISOString() : undefined,
      };

      dispatch({ type: 'ADD_INVOICE', payload: newInvoice });
      toast(`Invoice ${invoiceNumber} created${status === 'outstanding' ? ' and marked as sent' : ''}`);
      setSaving(false);
      onClose();
      navigate(`/invoices/${newInvoice.id}`);
    }, 300);
  }

  // --- Customer validation ---
  function validateCustomer(): boolean {
    const newErrors: Record<string, string> = {};
    if (!custFirstName.trim()) newErrors['firstName'] = 'First name is required.';
    if (!custLastName.trim()) newErrors['lastName'] = 'Last name is required.';
    if (!custEmail.trim()) {
      newErrors['email'] = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(custEmail.trim())) {
      newErrors['email'] = 'Please enter a valid email address.';
    } else {
      const dup = customers.find((c) => c.email.toLowerCase() === custEmail.toLowerCase().trim());
      if (dup) newErrors['email'] = 'A customer with this email already exists.';
    }
    if (custPhone.trim()) {
      const digits = custPhone.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 11) newErrors['phone'] = 'Must be a valid 10-digit US number.';
    }
    setCustErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleCreateCustomer() {
    if (!validateCustomer()) return;

    const newId = generateId('cust');
    const now = new Date().toISOString();
    const newCustomer: Customer = {
      id: newId,
      firstName: custFirstName.trim(),
      lastName: custLastName.trim(),
      email: custEmail.toLowerCase().trim(),
      phone: custPhone.trim(),
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    dispatch({ type: 'ADD_CUSTOMER', payload: newCustomer });
    toast('Customer created');

    // Select the new customer and go back to invoice form
    setCustomerId(newId);
    resetCustomerForm();
    setView('invoice');
  }

  // --- Render ---
  if (view === 'new-customer') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="New Customer" description="Add a customer, then continue creating the invoice.">
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setView('invoice')}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-2"
          >
            <ArrowLeft size={14} /> Back to Invoice
          </button>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={custFirstName}
              onChange={(e) => setCustFirstName(e.target.value)}
              error={custErrors['firstName']}
              required
              autoFocus
            />
            <Input
              label="Last Name"
              value={custLastName}
              onChange={(e) => setCustLastName(e.target.value)}
              error={custErrors['lastName']}
              required
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={custEmail}
            onChange={(e) => setCustEmail(e.target.value)}
            error={custErrors['email']}
            required
            placeholder="customer@example.com"
          />
          <Input
            label="Phone"
            type="tel"
            value={custPhone}
            onChange={(e) => setCustPhone(e.target.value)}
            error={custErrors['phone']}
            placeholder="(555) 000-0000"
            helperText="Optional"
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={() => setView('invoice')}>Cancel</Button>
            <Button type="button" onClick={handleCreateCustomer}>Create Customer</Button>
          </div>
        </div>
      </Modal>
    );
  }

  // Invoice form view
  const preselectedCustomer = preselectedCustomerId ? customers.find((c) => c.id === preselectedCustomerId) : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Invoice" size="lg">
      <div className="space-y-4">
        {/* Customer */}
        {preselectedCustomer ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
              {preselectedCustomer.firstName} {preselectedCustomer.lastName} ({preselectedCustomer.email})
            </p>
          </div>
        ) : (
          <div>
            <CustomerSelector
              value={customerId}
              onChange={setCustomerId}
              onRequestCreate={() => setView('new-customer')}
            />
            {errors['customer'] && <p className="mt-1 text-xs text-red-600">{errors['customer']}</p>}
          </div>
        )}

        {/* Amount + Tax */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="Amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              error={errors['amount']}
              required
              placeholder="0.00"
            />
          </div>
          <div className="flex items-end pb-2">
            {merchant.taxConfig.enabledForInvoices ? (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={taxEnabled}
                  onChange={(e) => setTaxEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-700">
                  {merchant.taxConfig.name} ({(merchant.taxConfig.rate * 100).toFixed(2)}%)
                </span>
              </label>
            ) : (
              <p className="text-xs text-gray-500">Tax disabled for invoices</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="inv-desc" className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="inv-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Services rendered, project description..."
            rows={3}
            className={`input-field resize-none ${errors['description'] ? 'input-error' : ''}`}
          />
          {errors['description'] && <p className="mt-1 text-xs text-red-600">{errors['description']}</p>}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => {
                setIssueDate(e.target.value);
                if (dueDate && dueDate < e.target.value) setDueDate('');
              }}
              min={new Date().toISOString().split('T')[0]}
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={issueDate}
              className={`input-field text-sm ${errors['dueDate'] ? 'input-error' : ''}`}
            />
            {errors['dueDate'] && <p className="mt-1 text-xs text-red-600">{errors['dueDate']}</p>}
          </div>
        </div>

        {/* Summary */}
        {parsedAmount > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">{formatCurrency(parsedAmount)}</span>
            </div>
            {taxEnabled && taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{merchant.taxConfig.name}</span>
                <span className="text-gray-900">{formatCurrency(taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-1">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900">{formatCurrency(total)}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="button" variant="outline" onClick={() => handleSave('draft')} loading={saving}>
            Save as Draft
          </Button>
          <Button type="button" onClick={() => handleSave('outstanding')} loading={saving}>
            Save & Send
          </Button>
        </div>
      </div>
    </Modal>
  );
}
