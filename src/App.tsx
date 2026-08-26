import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppStateProvider } from '@/context/AppStateContext';
import { DevControlsProvider } from '@/context/DevControlsContext';
import { ToastProvider } from '@/components/ui/Toast';
import { AppShell } from '@/components/layout/AppShell';
import { ScrollToTop } from '@/components/layout/ScrollToTop';

// Pages
import Dashboard from '@/pages/Dashboard';
import VirtualTerminal from '@/pages/VirtualTerminal';
import PaymentReceipt from '@/pages/PaymentReceipt';
import Transactions from '@/pages/Transactions';
import TransactionDetail from '@/pages/TransactionDetail';
import Customers from '@/pages/Customers';
import CustomerDetail from '@/pages/CustomerDetail';
import Invoices from '@/pages/Invoices';
import InvoiceDetail from '@/pages/InvoiceDetail';
import Processing from '@/pages/Processing';
import Settings from '@/pages/Settings';
import HostedPayment from '@/pages/HostedPayment';
import NotFound from '@/pages/NotFound';

// Dev Controls
import { DevControlsPanel } from '@/components/dev/DevControlsPanel';

export default function App() {
  return (
    <AppStateProvider>
      <DevControlsProvider>
        <ToastProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* Merchant portal (with shell) */}
              <Route element={<AppShell />}>
                <Route index element={<Dashboard />} />
                <Route path="terminal" element={<VirtualTerminal />} />
              <Route path="terminal/receipt/:txnId" element={<PaymentReceipt />} />
              <Route path="receipt/:txnId" element={<PaymentReceipt />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="transactions/:id" element={<TransactionDetail />} />
                <Route path="customers" element={<Customers />} />
                <Route path="customers/:id" element={<CustomerDetail />} />
                <Route path="invoices" element={<Invoices />} />
                <Route path="invoices/:id" element={<InvoiceDetail />} />
                <Route path="processing" element={<Processing />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Route>

              {/* Customer-facing payment page (no shell) */}
              <Route path="pay/:invoiceId" element={<HostedPayment />} />
            </Routes>

            {/* Dev Controls - floating panel */}
            <DevControlsPanel />
          </BrowserRouter>
        </ToastProvider>
      </DevControlsProvider>
    </AppStateProvider>
  );
}
