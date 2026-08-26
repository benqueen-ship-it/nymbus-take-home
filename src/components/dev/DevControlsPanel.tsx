import { Wrench, X, RotateCcw } from 'lucide-react';
import { useDevControls, type DevControlsState } from '@/context/DevControlsContext';

interface ToggleItem {
  key: keyof DevControlsState;
  label: string;
  description: string;
}

const globalToggles: ToggleItem[] = [
  { key: 'offlineMode', label: 'Offline Mode', description: 'Simulate network unavailability' },
  { key: 'slowNetwork', label: 'Slow Network', description: 'Add 3–5s delay to async operations' },
  { key: 'forceLoadingStates', label: 'Force Loading', description: 'Keep pages in loading state' },
  { key: 'localStorageUnavailable', label: 'localStorage Unavailable', description: 'Simulate storage failure' },
];

const vtToggles: ToggleItem[] = [
  { key: 'forcePaymentDecline', label: 'Force Decline', description: 'All payments decline' },
  { key: 'forceProcessingTimeout', label: 'Processing Timeout', description: 'Payment spinner never resolves' },
  { key: 'forceGatewayError', label: 'Gateway Error', description: 'Show processing error on submit' },
];

const invoiceToggles: ToggleItem[] = [
  { key: 'forceSendFailure', label: 'Send Failure', description: 'Invoice email send fails' },
  { key: 'forcePaymentPageError', label: 'Payment Page Error', description: 'Hosted payment fails' },
];

const transactionToggles: ToggleItem[] = [
  { key: 'forceRefundFailure', label: 'Refund Failure', description: 'Refund processing fails' },
];

const settingsToggles: ToggleItem[] = [
  { key: 'forceAddressValidationFailure', label: 'Address Validation Failure', description: 'Google API returns error' },
  { key: 'forceSaveFailure', label: 'Save Failure', description: 'Settings save fails' },
];

const dashboardToggles: ToggleItem[] = [
  { key: 'dashboardEmptyState', label: 'Empty State', description: 'Show empty dashboard' },
];

function ToggleSection({ title, items }: { title: string; items: ToggleItem[] }) {
  const { state, toggle } = useDevControls();

  return (
    <div className="mb-4">
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{title}</h4>
      <div className="space-y-2">
        {items.map((item) => (
          <label
            key={item.key}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-700/50 cursor-pointer"
          >
            <div>
              <p className="text-sm font-medium text-gray-200">{item.label}</p>
              <p className="text-xs text-gray-500">{item.description}</p>
            </div>
            <input
              type="checkbox"
              checked={state[item.key]}
              onChange={() => toggle(item.key)}
              className="w-4 h-4 rounded border-gray-600 text-brand-500 focus:ring-brand-500 bg-gray-700"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

export function DevControlsPanel() {
  const { activeCount, isPanelOpen, togglePanel, resetAll } = useDevControls();

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={togglePanel}
        className="fixed bottom-4 right-4 z-[90] w-12 h-12 rounded-full bg-gray-800 text-white shadow-lg flex items-center justify-center hover:bg-gray-700 transition-colors no-print"
        aria-label={`Dev Controls${activeCount > 0 ? ` (${activeCount} active)` : ''}`}
        title="Dev Controls (Ctrl+Shift+D)"
      >
        <Wrench size={20} />
        {activeCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {isPanelOpen && (
        <div className="fixed inset-y-0 right-0 z-[95] w-80 bg-gray-900 shadow-2xl overflow-y-auto no-print">
          {/* Header */}
          <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Dev Controls</h3>
              <p className="text-xs text-gray-400 mt-0.5">Simulate edge cases & errors</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={resetAll}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700"
                title="Reset all"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={togglePanel}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <ToggleSection title="Global" items={globalToggles} />
            <ToggleSection title="Virtual Terminal" items={vtToggles} />
            <ToggleSection title="Invoicing" items={invoiceToggles} />
            <ToggleSection title="Transactions" items={transactionToggles} />
            <ToggleSection title="Settings" items={settingsToggles} />
            <ToggleSection title="Dashboard" items={dashboardToggles} />
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700">
            <p className="text-xs text-gray-500 text-center">
              Ctrl+Shift+D to toggle • Resets on refresh
            </p>
          </div>
        </div>
      )}
    </>
  );
}
