import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users, MoreVertical, Edit2, UserX, UserCheck, Eye, Filter, X } from 'lucide-react';
import { useAppState, useAppDispatch } from '@/context/AppStateContext';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, formatRelativeTime } from '@/utils/format';
import { CustomerFormModal } from '@/components/customers/CustomerFormModal';
import type { Customer } from '@/data/types';

type StatusFilter = 'all' | 'active' | 'inactive';

export default function Customers() {
  const { customers, transactions, invoices } = useAppState();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | undefined>(undefined);
  const [statusCustomer, setStatusCustomer] = useState<Customer | undefined>(undefined);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [activityStartDate, setActivityStartDate] = useState('');
  const [activityEndDate, setActivityEndDate] = useState('');
  const [spendMin, setSpendMin] = useState('');
  const [spendMax, setSpendMax] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Compute customer metrics
  const customersWithMetrics = useMemo(() => {
    return customers.map((c) => {
      const customerTxns = transactions.filter(
        (t) => t.customerId === c.id && t.type === 'payment' && t.status === 'completed'
      );
      const totalSpend = customerTxns.reduce((sum, t) => sum + t.total, 0);

      const customerInvoices = invoices.filter((i) => i.customerId === c.id);
      const lastTxn = [...customerTxns].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      const lastInv = [...customerInvoices].sort((a, b) => (b.sentAt ?? b.issueDate).localeCompare(a.sentAt ?? a.issueDate))[0];

      const lastActivity = lastTxn?.createdAt ?? lastInv?.issueDate ?? c.createdAt;

      return { ...c, totalSpend, lastActivity };
    });
  }, [customers, transactions, invoices]);

  // Filter
  const filtered = useMemo(() => {
    let results = customersWithMetrics;

    // Status filter
    if (statusFilter !== 'all') {
      results = results.filter((c) => c.status === statusFilter);
    }

    // Activity date range
    if (activityStartDate) {
      results = results.filter((c) => c.lastActivity >= activityStartDate);
    }
    if (activityEndDate) {
      const endInclusive = activityEndDate + 'T23:59:59';
      results = results.filter((c) => c.lastActivity <= endInclusive);
    }

    // Spend range
    if (spendMin) {
      const min = parseFloat(spendMin);
      if (!isNaN(min)) results = results.filter((c) => c.totalSpend >= min);
    }
    if (spendMax) {
      const max = parseFloat(spendMax);
      if (!isNaN(max)) results = results.filter((c) => c.totalSpend <= max);
    }

    // Text search
    const q = search.toLowerCase().trim();
    if (q) {
      results = results.filter(
        (c) =>
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q)
      );
    }

    return results;
  }, [customersWithMetrics, search, statusFilter, activityStartDate, activityEndDate, spendMin, spendMax]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'active') count++; // non-default
    if (activityStartDate) count++;
    if (activityEndDate) count++;
    if (spendMin) count++;
    if (spendMax) count++;
    return count;
  }, [statusFilter, activityStartDate, activityEndDate, spendMin, spendMax]);

  function clearFilters() {
    setStatusFilter('active');
    setActivityStartDate('');
    setActivityEndDate('');
    setSpendMin('');
    setSpendMax('');
  }

  // Sort by last activity
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));
  }, [filtered]);

  function handleRowClick(customerId: string) {
    navigate(`/customers/${customerId}`);
  }

  function handleStatusChange() {
    if (!statusCustomer) return;
    const newStatus = statusCustomer.status === 'active' ? 'inactive' : 'active';
    dispatch({
      type: 'UPDATE_CUSTOMER',
      payload: { id: statusCustomer.id, updates: { status: newStatus } },
    });
    toast(`Customer ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
    setStatusCustomer(undefined);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your customer directory.</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowCreateModal(true)}>
          New Customer
        </Button>
      </div>

      {/* Search + Filter toggle */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
              aria-label="Search customers"
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
                  Reset to defaults
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="input-field text-sm"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Activity date range */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Activity From</label>
                <input
                  type="date"
                  value={activityStartDate}
                  onChange={(e) => {
                    setActivityStartDate(e.target.value);
                    // If end date is now before start date, clear it
                    if (activityEndDate && e.target.value && activityEndDate < e.target.value) {
                      setActivityEndDate('');
                    }
                  }}
                  max={activityEndDate || new Date().toISOString().split('T')[0]}
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Activity To</label>
                <input
                  type="date"
                  value={activityEndDate}
                  onChange={(e) => setActivityEndDate(e.target.value)}
                  min={activityStartDate || undefined}
                  max={new Date().toISOString().split('T')[0]}
                  className="input-field text-sm"
                />
              </div>

              {/* Spend range */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Spend Range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={spendMin}
                    onChange={(e) => {
                      setSpendMin(e.target.value);
                      // If max is now less than min, clear max
                      if (spendMax && e.target.value && parseFloat(spendMax) < parseFloat(e.target.value)) {
                        setSpendMax('');
                      }
                    }}
                    className="input-field text-sm w-full"
                    min="0"
                    max={spendMax || undefined}
                    step="0.01"
                  />
                  <span className="text-gray-400 text-xs">–</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={spendMax}
                    onChange={(e) => setSpendMax(e.target.value)}
                    className="input-field text-sm w-full"
                    min={spendMin || '0'}
                    step="0.01"
                  />
                </div>
                {spendMin && spendMax && parseFloat(spendMax) < parseFloat(spendMin) && (
                  <p className="mt-1 text-xs text-red-600">Max must be greater than min.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {(search || activeFilterCount > 0) && (
          <p className="text-xs text-gray-500">
            Showing {sorted.length} of {customers.length} customers
          </p>
        )}
      </div>

      {/* Table (desktop) / Cards (mobile) */}
      {sorted.length === 0 ? (
        <EmptyState
          icon={<Users size={24} />}
          title={search ? 'No customers match your search' : 'No customers yet'}
          description={search ? 'Try a different search term.' : 'Add your first customer to get started.'}
          action={
            !search ? (
              <Button size="sm" onClick={() => setShowCreateModal(true)}>
                Add Customer
              </Button>
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
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Name</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Email</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Phone</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Total Spend</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden xl:table-cell">Last Activity</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleRowClick(customer.id)}
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900">
                        {customer.firstName} {customer.lastName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{customer.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">{customer.phone}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={customer.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium text-right">
                      {formatCurrency(customer.totalSpend)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 text-right hidden xl:table-cell">
                      {formatRelativeTime(customer.lastActivity)}
                    </td>
                    <td className="px-2 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <RowMenu
                        customer={customer}
                        isOpen={openMenuId === customer.id}
                        onToggle={() => setOpenMenuId(openMenuId === customer.id ? null : customer.id)}
                        onClose={() => setOpenMenuId(null)}
                        onView={() => navigate(`/customers/${customer.id}`)}
                        onEdit={() => { setEditCustomer(customer); setOpenMenuId(null); }}
                        onToggleStatus={() => { setStatusCustomer(customer); setOpenMenuId(null); }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {sorted.map((customer) => (
              <div
                key={customer.id}
                className="card p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleRowClick(customer.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {customer.firstName} {customer.lastName}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{customer.email}</p>
                  </div>
                  <StatusBadge status={customer.status} />
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-500">Total spend</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(customer.totalSpend)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create Modal */}
      <CustomerFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Edit Modal */}
      <CustomerFormModal
        isOpen={!!editCustomer}
        onClose={() => setEditCustomer(undefined)}
        customer={editCustomer}
      />

      {/* Status Change Modal */}
      {statusCustomer && (
        <Modal
          isOpen={!!statusCustomer}
          onClose={() => setStatusCustomer(undefined)}
          title={statusCustomer.status === 'active' ? 'Deactivate Customer' : 'Activate Customer'}
          size="sm"
        >
          <p className="text-sm text-gray-600 mb-4">
            {statusCustomer.status === 'active'
              ? `Deactivate ${statusCustomer.firstName} ${statusCustomer.lastName}? They won't appear in customer selectors for new payments or invoices.`
              : `Reactivate ${statusCustomer.firstName} ${statusCustomer.lastName}? They will be available again.`}
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setStatusCustomer(undefined)}>Cancel</Button>
            <Button
              variant={statusCustomer.status === 'active' ? 'danger' : 'primary'}
              onClick={handleStatusChange}
            >
              {statusCustomer.status === 'active' ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// --- Row Action Menu ---
interface RowMenuProps {
  customer: Customer;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onView: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
}

function RowMenu({ customer, isOpen, onToggle, onClose, onView, onEdit, onToggleStatus }: RowMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={onToggle}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Actions"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-30 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
          <button
            onClick={onView}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Eye size={14} />
            View Details
          </button>
          <button
            onClick={onEdit}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Edit2 size={14} />
            Edit
          </button>
          <button
            onClick={onToggleStatus}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            {customer.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
            {customer.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      )}
    </div>
  );
}
