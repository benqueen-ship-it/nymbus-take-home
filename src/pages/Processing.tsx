import { useMemo, useState } from 'react';
import { Download, ChevronRight, X } from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate } from '@/utils/format';
import { generateStatementPdf } from '@/utils/generateStatementPdf';
import { seedStatements, seedDeposits } from '@/data/seed';

export default function Processing() {
  const { transactions } = useAppState();
  const merchant = useAppState().merchant;
  const { toast } = useToast();
  const [selectedDeposit, setSelectedDeposit] = useState<string | null>(null);

  // Current month summary (computed from real transactions)
  const monthlySummary = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]!;
    const startOfMonth = `${today.slice(0, 7)}-01`;

    const monthPayments = transactions.filter(
      (t) => t.type === 'payment' && t.status === 'completed' && t.createdAt >= startOfMonth
    );
    const monthRefunds = transactions.filter(
      (t) => t.type === 'refund' && t.status === 'completed' && t.createdAt >= startOfMonth
    );
    const monthChargebacks = transactions.filter(
      (t) => t.status === 'chargeback' && t.createdAt >= startOfMonth
    );

    const grossVolume = monthPayments.reduce((sum, t) => sum + t.total, 0);
    const refundsTotal = monthRefunds.reduce((sum, t) => sum + Math.abs(t.total), 0);
    const fees = grossVolume * 0.029 + monthPayments.length * 0.30;
    const chargebacksTotal = monthChargebacks.reduce((sum, t) => sum + (t.chargebackAmount ?? 0), 0);
    const net = grossVolume - refundsTotal - fees - chargebacksTotal;

    return {
      grossVolume,
      refundsTotal,
      fees: Math.round(fees * 100) / 100,
      chargebacksTotal,
      net: Math.round(net * 100) / 100,
      txnCount: monthPayments.length,
    };
  }, [transactions]);

  function handleDownloadStatement(month: string, gross: number, fees: number, net: number) {
    // Generate sample transactions for the statement
    const sampleTransactions = [
      { date: 'Jul 3', id: 'txn_stmt_001abc', customer: 'Sarah Chen', type: 'Payment', gross: 4500.00, fee: 130.80, net: 4369.20 },
      { date: 'Jul 5', id: 'txn_stmt_002def', customer: 'Marcus Johnson', type: 'Payment', gross: 3200.00, fee: 93.10, net: 3106.90 },
      { date: 'Jul 8', id: 'txn_stmt_003ghi', customer: 'Emily Rodriguez', type: 'Payment', gross: 6750.00, fee: 196.05, net: 6553.95 },
      { date: 'Jul 12', id: 'txn_stmt_004jkl', customer: 'David Kim', type: 'Payment', gross: 2100.00, fee: 61.20, net: 2038.80 },
      { date: 'Jul 15', id: 'txn_stmt_005mno', customer: 'Rachel Thompson', type: 'Payment', gross: 890.00, fee: 26.11, net: 863.89 },
      { date: 'Jul 18', id: 'txn_stmt_006pqr', customer: 'James Okafor', type: 'Payment', gross: 5200.00, fee: 151.10, net: 5048.90 },
      { date: 'Jul 20', id: 'txn_stmt_007stu', customer: 'Lisa Patel', type: 'Payment', gross: 1750.00, fee: 51.05, net: 1698.95 },
      { date: 'Jul 22', id: 'txn_stmt_008vwx', customer: 'Amanda Foster', type: 'Payment', gross: 3200.00, fee: 93.10, net: 3106.90 },
      { date: 'Jul 25', id: 'txn_stmt_009yza', customer: 'Emily Rodriguez', type: 'Refund', gross: -860.00, fee: 0, net: -860.00 },
    ];

    generateStatementPdf({
      month,
      merchantName: merchant.displayName,
      grossVolume: gross,
      refunds: 860.00,
      fees,
      chargebacks: 0,
      net,
      transactions: sampleTransactions,
    });
    toast('Statement downloaded as PDF');
  }

  const activeDeposit = seedDeposits.find((d) => d.id === selectedDeposit);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Processing</h1>
      <p className="mt-1 text-sm text-gray-500">View processing volume, statements, and deposits.</p>

      {/* Current Month Summary */}
      <Card className="p-5 mt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Current Month Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Gross Volume</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(monthlySummary.grossVolume)}</p>
            <p className="text-xs text-gray-400">{monthlySummary.txnCount} transactions</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Refunds</p>
            <p className="text-lg font-bold text-red-600 mt-1">-{formatCurrency(monthlySummary.refundsTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Fees (2.9% + $0.30)</p>
            <p className="text-lg font-bold text-gray-700 mt-1">-{formatCurrency(monthlySummary.fees)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Chargebacks</p>
            <p className="text-lg font-bold text-purple-600 mt-1">-{formatCurrency(monthlySummary.chargebacksTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Net Deposits</p>
            <p className="text-lg font-bold text-green-700 mt-1">{formatCurrency(monthlySummary.net)}</p>
          </div>
        </div>
      </Card>

      {/* Processing Statements */}
      <Card className="mt-6 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Processing Statements</h3>
          <p className="text-xs text-gray-500 mt-0.5">Monthly processing summaries</p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Month</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3">Gross Volume</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3 hidden sm:table-cell">Fees</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3">Net</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {seedStatements.map((stmt) => (
              <tr key={stmt.id} className="hover:bg-gray-50/50">
                <td className="px-5 py-3 text-sm font-medium text-gray-900">{stmt.month}</td>
                <td className="px-5 py-3 text-sm text-gray-700 text-right">{formatCurrency(stmt.grossVolume)}</td>
                <td className="px-5 py-3 text-sm text-gray-700 text-right hidden sm:table-cell">{formatCurrency(stmt.fees)}</td>
                <td className="px-5 py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(stmt.net)}</td>
                <td className="px-5 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Download size={14} />}
                    onClick={() => handleDownloadStatement(stmt.month, stmt.grossVolume, stmt.fees, stmt.net)}
                  >
                    Download
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Deposits */}
      <Card className="mt-6 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Deposits</h3>
              <p className="text-xs text-gray-500 mt-0.5">Settlement activity</p>
            </div>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded font-mono">
              Settlement Account: •••• 4821
            </span>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Date</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Status</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3 hidden sm:table-cell">Gross</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3 hidden md:table-cell">Fees</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3 hidden md:table-cell">Adj.</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3">Net</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {seedDeposits.map((dep) => (
              <tr
                key={dep.id}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedDeposit(dep.id === selectedDeposit ? null : dep.id)}
              >
                <td className="px-5 py-3 text-sm text-gray-900">{formatDate(dep.date)}</td>
                <td className="px-5 py-3">
                  <StatusBadge status={dep.status} />
                </td>
                <td className="px-5 py-3 text-sm text-gray-700 text-right hidden sm:table-cell">{formatCurrency(dep.grossAmount)}</td>
                <td className="px-5 py-3 text-sm text-gray-700 text-right hidden md:table-cell">-{formatCurrency(dep.fees)}</td>
                <td className="px-5 py-3 text-sm text-gray-700 text-right hidden md:table-cell">
                  {dep.adjustments !== 0 ? formatCurrency(dep.adjustments) : '—'}
                </td>
                <td className="px-5 py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(dep.netAmount)}</td>
                <td className="px-3 py-3 text-gray-400">
                  <ChevronRight size={16} className={`transition-transform ${selectedDeposit === dep.id ? 'rotate-90' : ''}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Deposit Detail Drawer */}
      {activeDeposit && (
        <div className="fixed inset-y-0 right-0 z-40 w-96 bg-white shadow-2xl border-l border-gray-200 overflow-y-auto">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
            <h3 className="text-base font-semibold text-gray-900">Deposit Detail</h3>
            <button
              onClick={() => setSelectedDeposit(null)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date</span>
                <span className="text-gray-900">{formatDate(activeDeposit.date)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <StatusBadge status={activeDeposit.status} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Gross</span>
                <span className="text-gray-900">{formatCurrency(activeDeposit.grossAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Fees</span>
                <span className="text-gray-700">-{formatCurrency(activeDeposit.fees)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Adjustments</span>
                <span className="text-gray-700">{activeDeposit.adjustments !== 0 ? formatCurrency(activeDeposit.adjustments) : '—'}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t border-gray-100 pt-2">
                <span className="text-gray-900">Net Deposit</span>
                <span className="text-green-700">{formatCurrency(activeDeposit.netAmount)}</span>
              </div>
            </div>

            {/* Batch Breakdown */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Batch Transactions</h4>
              <div className="space-y-2">
                {activeDeposit.batchTransactions.map((bt) => (
                  <div key={bt.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-900">{bt.customer}</p>
                      <p className="text-xs text-gray-500 font-mono">{bt.id}</p>
                    </div>
                    <span className={`text-sm font-medium ${bt.amount < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {bt.amount < 0 ? '-' : ''}{formatCurrency(Math.abs(bt.amount))}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Settlement Account */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">Settlement Account</p>
              <p className="text-sm font-mono text-gray-900 mt-0.5">•••• 4821</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
