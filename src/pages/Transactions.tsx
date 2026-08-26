import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, X, ArrowLeftRight } from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, formatRelativeTime } from '@/utils/format';
import type { TransactionStatus, TransactionSource } from '@/data/types';

type StatusFilterValue = 'all' | TransactionStatus;
type SourceFilterValue = 'all' | TransactionSource;

export default function Transactions() {
  const { transactions, customers } = useAppState();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilterValue>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Helper to get customer name
  function getCustomerName(customerId: string | null): string {
    if (!customerId) return 'Walk-in Customer';
    const c = customers.find((cust) => cust.id === customerId);
    return c ? `${c.firstName} ${c.lastName}` : 'Unknown Customer';
  }

  function getSourceLabel(source: TransactionSource): string {
    return source === 'virtual_terminal' ? 'Virtual Terminal' : 'Invoice Payment';
  }

  // Filter logic
  const filtered = useMemo(() => {
    let results = [...transactions];

    // Status
    if (statusFilter !== 'all') {
      results = results.filter((t) => t.status === statusFilter);
    }

    // Source
    if (sourceFilter !== 'all') {
      results = results.filter((t) => t.source === sourceFilter);
    }

    // Date range
    if (startDate) {
      results = results.filter((t) => t.createdAt >= startDate);
    }
    if (endDate) {
      results = results.filter((t) => t.createdAt <= endDate + 'T23:59:59');
    }

    // Amount range
    if (amountMin) {
      const min = parseFloat(amountMin);
      if (!isNaN(min)) results = results.filter((t) => Math.abs(t.total) >= min);
    }
    if (amountMax) {
      const max = parseFloat(amountMax);
      if (!isNaN(max)) results = results.filter((t) => Math.abs(t.total) <= max);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      results = results.filter((t) => {
        const customerName = getCustomerName(t.customerId).toLowerCase();
        const customerEmail = t.customerId
          ? (customers.find((c) => c.id === t.customerId)?.email ?? '').toLowerCase()
          : '';
        return (
          t.id.toLowerCase().includes(q) ||
          customerName.includes(q) ||
          customerEmail.includes(q)
        );
      });
    }

    return results;
  }, [transactions, customers, search, statusFilter, sourceFilter, startDate, endDate, amountMin, amountMax]);

  // Sort by date descending
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [filtered]);

  // Totals
  const totalAmount = sorted
    .filter((t) => t.type === 'payment' && t.status === 'completed')
    .reduce((sum, t) => sum + t.total, 0);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (sourceFilter !== 'all') count++;
    if (startDate) count++;
    if (endDate) count++;
    if (amountMin) count++;
    if (amountMax) count++;
    return count;
  }, [statusFilter, sourceFilter, startDate, endDate, amountMin, amountMax]);

  function clearFilters() {
    setStatusFilter('all');
    setSourceFilter('all');
    setStartDate('');
    setEndDate('');
    setAmountMin('');
    setAmountMax('');
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
        <p className="mt-1 text-sm text-gray-500">View and manage payment activity.</p>
      </div>

      {/* Search + Filters */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, customer name, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
              aria-label="Search transactions"
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

        {/* Filter panel */}
        {showFilters && (
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Filters</h3>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                >
                  <X size={12} />
                  Clear all
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilterValue)}
                  className="input-field text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="declined">Declined</option>
                  <option value="refunded">Refunded</option>
                  <option value="chargeback">Chargeback</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Source</label>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value as SourceFilterValue)}
                  className="input-field text-sm"
                >
                  <option value="all">All Sources</option>
                  <option value="virtual_terminal">Virtual Terminal</option>
                  <option value="invoice_payment">Invoice Payment</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (endDate && e.target.value && endDate < e.target.value) setEndDate('');
                  }}
                  max={endDate || new Date().toISOString().split('T')[0]}
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || undefined}
                  max={new Date().toISOString().split('T')[0]}
                  className="input-field text-sm"
                />
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
                      if (amountMax && e.target.value && parseFloat(amountMax) < parseFloat(e.target.value)) {
                        setAmountMax('');
                      }
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

        {/* Result count */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Showing {sorted.length} of {transactions.length} transactions
          </span>
          {totalAmount > 0 && (
            <span className="font-medium text-gray-700">
              Completed total: {formatCurrency(totalAmount)}
            </span>
          )}
        </div>
      </div>

      {/* Table / Empty state */}
      {sorted.length === 0 ? (
        <EmptyState
          icon={<ArrowLeftRight size={24} />}
          title={search || activeFilterCount > 0 ? 'No transactions match your filters' : 'No transactions yet'}
          description={
            search || activeFilterCount > 0
              ? 'Try adjusting your search or filters.'
              : 'Process your first payment in the Virtual Terminal.'
          }
          action={
            activeFilterCount > 0 ? (
              <button onClick={clearFilters} className="text-sm text-brand-600 hover:underline font-medium">
                Clear all filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Date</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">ID</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Customer</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Source</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map((txn) => (
                  <tr
                    key={txn.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/transactions/${txn.id}`)}
                  >
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {formatRelativeTime(txn.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                      {txn.id.slice(0, 12)}...
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {getCustomerName(txn.customerId)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell">
                      {getSourceLabel(txn.source)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={txn.status} />
                    </td>
                    <td className={`px-4 py-3 text-sm font-medium text-right whitespace-nowrap ${
                      txn.type === 'refund' ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {txn.type === 'refund' ? '-' : ''}{formatCurrency(Math.abs(txn.total))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {sorted.map((txn) => (
              <div
                key={txn.id}
                className="card p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/transactions/${txn.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{getCustomerName(txn.customerId)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatRelativeTime(txn.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${txn.type === 'refund' ? 'text-red-600' : 'text-gray-900'}`}>
                      {txn.type === 'refund' ? '-' : ''}{formatCurrency(Math.abs(txn.total))}
                    </p>
                    <StatusBadge status={txn.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
