import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, FileText, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';
import { useDevControls } from '@/context/DevControlsContext';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatRelativeTime, formatDate } from '@/utils/format';

export default function Dashboard() {
  const { transactions, invoices, customers } = useAppState();
  const { state: devControls } = useDevControls();

  const metrics = useMemo(() => {
    if (devControls.dashboardEmptyState) {
      return {
        todaysSales: { amount: 0, count: 0 },
        outstandingInvoices: { amount: 0, count: 0 },
        overdueInvoices: { amount: 0, count: 0 },
        nextDeposit: { amount: 0, date: '' },
        processingSummary: { grossVolume: 0, estimatedFees: 0, netDeposits: 0 },
      };
    }

    const today = new Date().toISOString().split('T')[0]!;
    const startOfMonth = `${today.slice(0, 7)}-01`;

    // Today's Sales
    const todayTxns = transactions.filter(
      (t) => t.type === 'payment' && t.status === 'completed' && t.createdAt.startsWith(today)
    );
    const todaysSales = {
      amount: todayTxns.reduce((sum, t) => sum + t.total, 0),
      count: todayTxns.length,
    };

    // Outstanding Invoices (not overdue)
    const outstanding = invoices.filter((i) => i.status === 'outstanding' && i.dueDate >= today);
    const outstandingInvoices = {
      amount: outstanding.reduce((sum, i) => sum + i.total, 0),
      count: outstanding.length,
    };

    // Overdue Invoices
    const overdue = invoices.filter((i) => i.status === 'outstanding' && i.dueDate < today);
    const overdueInvoices = {
      amount: overdue.reduce((sum, i) => sum + i.total, 0),
      count: overdue.length,
    };

    // Next Deposit (mock: today's sales minus fees, T+2)
    const depositDate = new Date();
    depositDate.setDate(depositDate.getDate() + 2);
    const netAmount = todaysSales.amount * 0.971 - todaysSales.count * 0.30;
    const nextDeposit = {
      amount: netAmount > 0 ? Math.round(netAmount * 100) / 100 : 0,
      date: netAmount > 0 ? depositDate.toISOString().split('T')[0]! : '',
    };

    // Processing Summary (current month)
    const monthTxns = transactions.filter(
      (t) => t.type === 'payment' && t.status === 'completed' && t.createdAt >= startOfMonth
    );
    const grossVolume = monthTxns.reduce((sum, t) => sum + t.total, 0);
    const estimatedFees = grossVolume * 0.029 + monthTxns.length * 0.30;

    return {
      todaysSales,
      outstandingInvoices,
      overdueInvoices,
      nextDeposit,
      processingSummary: {
        grossVolume,
        estimatedFees: Math.round(estimatedFees * 100) / 100,
        netDeposits: Math.round((grossVolume - estimatedFees) * 100) / 100,
      },
    };
  }, [transactions, invoices, devControls.dashboardEmptyState]);

  // Recent activity (last 10 transactions)
  const recentActivity = useMemo(() => {
    if (devControls.dashboardEmptyState) return [];
    return [...transactions]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 10);
  }, [transactions, devControls.dashboardEmptyState]);

  // Overdue invoices for attention section
  const overdueInvoices = useMemo(() => {
    if (devControls.dashboardEmptyState) return [];
    const today = new Date().toISOString().split('T')[0]!;
    return invoices
      .filter((i) => i.status === 'outstanding' && i.dueDate < today)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5);
  }, [invoices, devControls.dashboardEmptyState]);

  function getCustomerName(customerId: string | null): string {
    if (!customerId) return 'Walk-in Customer';
    const c = customers.find((cust) => cust.id === customerId);
    return c ? `${c.firstName} ${c.lastName}` : 'Unknown';
  }

  function getDaysOverdue(dueDate: string): number {
    return Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">Your business at a glance.</p>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <MetricCard
          icon={<DollarSign size={20} />}
          label="Today's Sales"
          value={formatCurrency(metrics.todaysSales.amount)}
          sublabel={`${metrics.todaysSales.count} transaction${metrics.todaysSales.count !== 1 ? 's' : ''}`}
          accentColor="text-green-600 bg-green-50"
        />
        <MetricCard
          icon={<FileText size={20} />}
          label="Outstanding Invoices"
          value={formatCurrency(metrics.outstandingInvoices.amount)}
          sublabel={`${metrics.outstandingInvoices.count} invoice${metrics.outstandingInvoices.count !== 1 ? 's' : ''}`}
          accentColor="text-blue-600 bg-blue-50"
        />
        <MetricCard
          icon={<AlertTriangle size={20} />}
          label="Overdue Invoices"
          value={formatCurrency(metrics.overdueInvoices.amount)}
          sublabel={`${metrics.overdueInvoices.count} invoice${metrics.overdueInvoices.count !== 1 ? 's' : ''}`}
          accentColor="text-red-600 bg-red-50"
        />
        <MetricCard
          icon={<TrendingUp size={20} />}
          label="Next Deposit"
          value={metrics.nextDeposit.amount > 0 ? formatCurrency(metrics.nextDeposit.amount) : '$0.00'}
          sublabel={metrics.nextDeposit.date ? formatDate(metrics.nextDeposit.date) : 'No pending deposits'}
          accentColor="text-brand-600 bg-brand-50"
        />
      </div>

      {/* Two columns: Activity + Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Recent Activity */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
            <Link to="/transactions" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No recent activity.</p>
          ) : (
            <div className="space-y-1">
              {recentActivity.map((txn) => (
                <Link
                  key={txn.id}
                  to={`/transactions/${txn.id}`}
                  className="flex items-center justify-between py-2 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm text-gray-900">
                      {txn.type === 'refund' ? 'Refund to' : 'Payment from'} {getCustomerName(txn.customerId)}
                    </p>
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

        {/* Attention Required */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Attention Required</h3>
            {overdueInvoices.length > 0 && (
              <Link to="/invoices" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            )}
          </div>
          {overdueInvoices.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-green-700 font-medium">All caught up!</p>
              <p className="text-xs text-gray-500 mt-1">No overdue invoices.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {overdueInvoices.map((inv) => {
                const customerName = getCustomerName(inv.customerId);
                const daysOverdue = getDaysOverdue(inv.dueDate);
                return (
                  <Link
                    key={inv.id}
                    to={`/invoices/${inv.id}`}
                    className="flex items-center justify-between py-2 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm text-gray-900">{inv.invoiceNumber} — {customerName}</p>
                      <p className="text-xs text-red-600">{daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue</p>
                    </div>
                    <span className="text-sm font-medium text-red-700">{formatCurrency(inv.total)}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Processing Summary */}
      <Card className="p-5 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Processing Summary — This Month</h3>
          <Link to="/processing" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
            View details <ArrowRight size={12} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Gross Volume</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(metrics.processingSummary.grossVolume)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Estimated Fees</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(metrics.processingSummary.estimatedFees)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Net Deposits</p>
            <p className="text-xl font-bold text-green-700 mt-1">{formatCurrency(metrics.processingSummary.netDeposits)}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// --- Metric Card ---
function MetricCard({
  icon,
  label,
  value,
  sublabel,
  accentColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel: string;
  accentColor: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accentColor}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
          <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
          <p className="text-xs text-gray-500">{sublabel}</p>
        </div>
      </div>
    </Card>
  );
}
