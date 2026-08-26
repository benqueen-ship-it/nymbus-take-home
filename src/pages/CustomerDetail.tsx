import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, UserX, UserCheck, Mail, Phone, Calendar, FileText } from 'lucide-react';
import { useAppState, useAppDispatch } from '@/context/AppStateContext';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, formatDate, formatRelativeTime } from '@/utils/format';
import { CustomerFormModal } from '@/components/customers/CustomerFormModal';
import { InvoiceFormModal } from '@/components/invoices/InvoiceFormModal';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customers, transactions, invoices } = useAppState();
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const customer = customers.find((c) => c.id === id);

  const customerTxns = useMemo(() => {
    if (!customer) return [];
    return transactions
      .filter((t) => t.customerId === customer.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 10);
  }, [customer, transactions]);

  const customerInvoices = useMemo(() => {
    if (!customer) return [];
    return invoices
      .filter((i) => i.customerId === customer.id)
      .sort((a, b) => b.issueDate.localeCompare(a.issueDate))
      .slice(0, 10);
  }, [customer, invoices]);

  const metrics = useMemo(() => {
    if (!customer) return { totalSpend: 0, totalInvoiced: 0, txnCount: 0, invCount: 0 };
    const completedTxns = transactions.filter(
      (t) => t.customerId === customer.id && t.type === 'payment' && t.status === 'completed'
    );
    const custInvoices = invoices.filter((i) => i.customerId === customer.id);
    return {
      totalSpend: completedTxns.reduce((sum, t) => sum + t.total, 0),
      totalInvoiced: custInvoices.reduce((sum, i) => sum + i.total, 0),
      txnCount: completedTxns.length,
      invCount: custInvoices.length,
    };
  }, [customer, transactions, invoices]);

  if (!customer) {
    return (
      <EmptyState
        title="Customer not found"
        description="This customer doesn't exist or may have been removed."
        action={
          <Button variant="secondary" onClick={() => navigate('/customers')}>
            Back to Customers
          </Button>
        }
      />
    );
  }

  function handleStatusChange() {
    const newStatus = customer!.status === 'active' ? 'inactive' : 'active';
    dispatch({
      type: 'UPDATE_CUSTOMER',
      payload: { id: customer!.id, updates: { status: newStatus } },
    });
    toast(`Customer ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
    setShowStatusModal(false);
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link to="/customers" className="hover:text-brand-600 flex items-center gap-1">
          <ArrowLeft size={14} />
          Customers
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">
          {customer.firstName} {customer.lastName}
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold text-lg">
            {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {customer.firstName} {customer.lastName}
            </h1>
            <StatusBadge status={customer.status} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<Edit2 size={14} />} onClick={() => setShowEditModal(true)}>
            Edit
          </Button>
          <Button variant="outline" size="sm" icon={<FileText size={14} />} onClick={() => setShowInvoiceModal(true)}>
            Create Invoice
          </Button>
          <Button
            variant={customer.status === 'active' ? 'ghost' : 'outline'}
            size="sm"
            icon={customer.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
            onClick={() => setShowStatusModal(true)}
          >
            {customer.status === 'active' ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: info + metrics */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contact Info */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail size={14} className="text-gray-400" />
                <a href={`mailto:${customer.email}`} className="text-brand-600 hover:underline">
                  {customer.email}
                </a>
              </div>
              {customer.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={14} className="text-gray-400" />
                  <span className="text-gray-700">{customer.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={14} className="text-gray-400" />
                <span className="text-gray-500">Customer since {formatDate(customer.createdAt)}</span>
              </div>
            </div>
          </Card>

          {/* Metrics */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Total Spend</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(metrics.totalSpend)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Invoiced</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(metrics.totalInvoiced)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Transactions</p>
                <p className="text-lg font-semibold text-gray-900">{metrics.txnCount}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Invoices</p>
                <p className="text-lg font-semibold text-gray-900">{metrics.invCount}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right column: transactions + invoices */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Transactions */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Transactions</h3>
            {customerTxns.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No transactions yet.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {customerTxns.map((txn) => (
                  <Link
                    key={txn.id}
                    to={`/transactions/${txn.id}`}
                    className="flex items-center justify-between py-2.5 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
                  >
                    <div>
                      <p className="text-sm text-gray-900">{txn.note || 'Payment'}</p>
                      <p className="text-xs text-gray-500">{formatRelativeTime(txn.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${txn.type === 'refund' ? 'text-red-600' : 'text-gray-900'}`}>
                        {txn.type === 'refund' ? '-' : ''}{formatCurrency(Math.abs(txn.total))}
                      </span>
                      <StatusBadge status={txn.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Invoices */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Invoices</h3>
            {customerInvoices.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No invoices yet.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {customerInvoices.map((inv) => {
                  const isOverdue = inv.status === 'outstanding' && inv.dueDate < new Date().toISOString().split('T')[0]!;
                  return (
                    <Link
                      key={inv.id}
                      to={`/invoices/${inv.id}`}
                      className="flex items-center justify-between py-2.5 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
                    >
                      <div>
                        <p className="text-sm text-gray-900">{inv.invoiceNumber} — {inv.description}</p>
                        <p className="text-xs text-gray-500">Due {formatDate(inv.dueDate)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{formatCurrency(inv.total)}</span>
                        <StatusBadge status={isOverdue ? 'overdue' : inv.status} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <CustomerFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        customer={customer}
      />

      {/* Create Invoice Modal */}
      <InvoiceFormModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        preselectedCustomerId={customer.id}
      />

      {/* Activate/Deactivate Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title={customer.status === 'active' ? 'Deactivate Customer' : 'Activate Customer'}
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-4">
          {customer.status === 'active'
            ? `Are you sure you want to deactivate ${customer.firstName} ${customer.lastName}? They will no longer appear in customer selectors for new payments or invoices.`
            : `Reactivate ${customer.firstName} ${customer.lastName}? They will be available for payments and invoices again.`}
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>Cancel</Button>
          <Button
            variant={customer.status === 'active' ? 'danger' : 'primary'}
            onClick={handleStatusChange}
          >
            {customer.status === 'active' ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
