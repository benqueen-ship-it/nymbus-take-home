import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, X, FileText } from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, formatDate } from '@/utils/format';
import { getEffectiveStatus } from '@/utils/invoice';
import { InvoiceFormModal } from '@/components/invoices/InvoiceFormModal';
import type { InvoiceStatus } from '@/data/types';

type StatusFilterValue = 'all' | InvoiceStatus;

export default function Invoices() {
  const { invoices, customers } = useAppState();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [dueDateStart, setDueDateStart] = useState('');
  const [dueDateEnd, setDueDateEnd] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Metrics
  const metrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]!;
    const startOfMonth = `${today.slice(0, 7)}-01`;

    const outstanding = invoices.filter((i) => i.status === 'outstanding' && i.dueDate >= today);
    const overdue = invoices.filter((i) => i.status === 'outstanding' && i.dueDate < today);
    const paidThisMonth = invoices.filter((i) => i.status === 'paid' && i.paidAt && i.paidAt >= startOfMonth);

    return {
      outstandingAmount: outstanding.reduce((sum, i) => sum + i.total, 0),
      outstandingCount: outstanding.length,
      overdueAmount: overdue.reduce((sum, i) => sum + i.total, 0),
      overdueCount: overdue.length,
      paidThisMonth: paidThisMonth.reduce((sum, i) => sum + i.total, 0),
      paidThisMonthCount: paidThisMonth.length,
      totalCount: invoices.length,
    };
  }, [invoices]);

  // Customer name helper
  function getCustomerName(customerId: string): string {
    const c = customers.find((cust) => cust.id === customerId);
    return c ? `${c.firstName} ${c.lastName}` : 'Unknown';
  }

  // Filter logic
  const filtered = useMemo(() => {
    let results = invoices.map((inv) => ({
      ...inv,
      effectiveStatus: getEffectiveStatus(inv),
    }));

    // Status
    if (statusFilter !== 'all') {
      results = results.filter((i) => i.effectiveStatus === statusFilter);
    }

    // Customer
    if (customerFilter !== 'all') {
      results = results.filter((i) => i.customerId === customerFilter);
    }

    // Due date range
    if (dueDateStart) {
      results = results.filter((i) => i.dueDate >= dueDateStart);
    }
    if (dueDateEnd) {
      results = results.filter((i) => i.dueDate <= dueDateEnd);
    }

    // Amount range
    if (amountMin) {
      const min = parseFloat(amountMin);
      if (!isNaN(min)) results = results.filter((i) => i.total >= min);
    }
    if (amountMax) {
      const max = parseFloat(amountMax);
      if (!isNaN(max)) results = results.filter((i) => i.total <= max);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      results = results.filter((i) => {
        const customerName = getCustomerName(i.customerId).toLowerCase();
        const customerEmail = (customers.find((c) => c.id === i.customerId)?.email ?? '').toLowerCase();
        return (
          i.invoiceNumber.toLowerCase().includes(q) ||
          customerName.includes(q) ||
          customerEmail.includes(q) ||
          i.description.toLowerCase().includes(q)
        );
      });
    }

    return results;
  }, [invoices, customers, search, statusFilter, customerFilter, dueDateStart, dueDateEnd, amountMin, amountMax]);

  // Sort: overdue first, then by due date ascending
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (a.effectiveStatus === 'overdue' && b.effectiveStatus !== 'overdue') return -1;
      if (b.effectiveStatus === 'overdue' && a.effectiveStatus !== 'overdue') return 1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [filtered]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (customerFilter !== 'all') count++;
    if (dueDateStart) count++;
    if (dueDateEnd) count++;
    if (amountMin) count++;
    if (amountMax) count++;
    return count;
  }, [statusFilter, customerFilter, dueDateStart, dueDateEnd, amountMin, amountMax]);

  function clearFilters() {
    setStatusFilter('all');
    setCustomerFilter('all');
    setDueDateStart('');
    setDueDateEnd('');
    setAmountMin('');
    setAmountMax('');
  }

  // Unique customers for filter dropdown
  const customerOptions = useMemo(() => {
    const ids = [...new Set(invoices.map((i) => i.customerId))];
    return ids.map((id) => ({ id, name: getCustomerName(id) })).sort((a, b) => a.name.localeCompare(b.name));
  }, [invoices, customers]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
          <p className="mt-1 text-sm text-gray-500">Create and manage invoices.</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowCreateModal(true)}>
          New Invoice
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Outstanding</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(metrics.outstandingAmount)}</p>
          <p className="text-xs text-gray-500 mt-0.5">{metrics.outstandingCount} invoices</p>
        </Card>
        <Card className="p-4 border-red-200">
          <p className="text-xs font-medium text-red-600 uppercase">Overdue</p>
          <p className="text-xl font-bold text-red-700 mt-1">{formatCurrency(metrics.overdueAmount)}</p>
          <p className="text-xs text-red-500 mt-0.5">{metrics.overdueCount} invoices</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Paid This Month</p>
          <p className="text-xl font-bold text-green-700 mt-1">{formatCurrency(metrics.paidThisMonth)}</p>
          <p className="text-xs text-gray-500 mt-0.5">{metrics.paidThisMonthCount} invoices</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Total Invoices</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{metrics.totalCount}</p>
        </Card>
      </div>

      {/* Search + Filters */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice #, customer, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
              aria-label="Search invoices"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'bg-brand-50 border-brand-200 text-brand-700'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 w-5 h-5 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Filters</h3>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                  <X size={12} /> Clear all
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilterValue)} className="input-field text-sm">
                  <option value="all">All</option>
                  <option value="draft">Draft</option>
                  <option value="outstanding">Outstanding</option>
                  <option value="overdue">Overdue</option>
                  <option value="paid">Paid</option>
                  <option value="written_off">Written Off</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Customer</label>
                <select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} className="input-field text-sm">
                  <option value="all">All Customers</option>
                  {customerOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Due Date Range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dueDateStart}
                    onChange={(e) => {
                      setDueDateStart(e.target.value);
                      if (dueDateEnd && e.target.value && dueDateEnd < e.target.value) setDueDateEnd('');
                    }}
                    max={dueDateEnd || undefined}
                    className="input-field text-sm w-full"
                  />
                  <span className="text-gray-400 text-xs">–</span>
                  <input
                    type="date"
                    value={dueDateEnd}
                    onChange={(e) => setDueDateEnd(e.target.value)}
                    min={dueDateStart || undefined}
                    className="input-field text-sm w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Amount Range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={amountMin}
                    onChange={(e) => {
                      setAmountMin(e.target.value);
                      if (amountMax && e.target.value && parseFloat(amountMax) < parseFloat(e.target.value)) setAmountMax('');
                    }}
                    className="input-field text-sm w-full"
                    min="0"
                    max={amountMax || undefined}
                    step="0.01"
                  />
                  <span className="text-gray-400 text-xs">–</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={amountMax}
                    onChange={(e) => setAmountMax(e.target.value)}
                    className="input-field text-sm w-full"
                    min={amountMin || '0'}
                    step="0.01"
                  />
                </div>
                {amountMin && amountMax && parseFloat(amountMax) < parseFloat(amountMin) && (
                  <p className="mt-1 text-xs text-red-600">Max must be greater than min.</p>
                )}
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500">
          Showing {sorted.length} of {invoices.length} invoices
        </p>
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <EmptyState
          icon={<FileText size={24} />}
          title={search || activeFilterCount > 0 ? 'No invoices match your filters' : 'No invoices yet'}
          description={search || activeFilterCount > 0 ? 'Try adjusting your filters.' : 'Create your first invoice to get started.'}
          action={!search && activeFilterCount === 0 ? <Button size="sm" onClick={() => setShowCreateModal(true)}>Create Invoice</Button> : undefined}
        />
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Invoice</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Customer</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Due Date</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map((inv) => (
                  <tr
                    key={inv.id}
                    className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                      inv.effectiveStatus === 'overdue' ? 'border-l-2 border-l-red-400' : ''
                    }`}
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{inv.invoiceNumber}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">{inv.description}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{getCustomerName(inv.customerId)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={inv.effectiveStatus} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">{formatDate(inv.dueDate)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(inv.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {sorted.map((inv) => (
              <div
                key={inv.id}
                className={`card p-4 cursor-pointer hover:shadow-md transition-shadow ${
                  inv.effectiveStatus === 'overdue' ? 'border-l-2 border-l-red-400' : ''
                }`}
                onClick={() => navigate(`/invoices/${inv.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{inv.invoiceNumber}</p>
                    <p className="text-xs text-gray-500">{getCustomerName(inv.customerId)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(inv.total)}</p>
                    <StatusBadge status={inv.effectiveStatus} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create Modal */}
      <InvoiceFormModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}
