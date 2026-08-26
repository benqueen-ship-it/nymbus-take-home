import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';

export interface DevControlsState {
  // Global
  offlineMode: boolean;
  slowNetwork: boolean;
  forceLoadingStates: boolean;
  localStorageUnavailable: boolean;
  // Virtual Terminal
  forcePaymentDecline: boolean;
  forceProcessingTimeout: boolean;
  forceGatewayError: boolean;
  // Invoicing
  forceSendFailure: boolean;
  forcePaymentPageError: boolean;
  // Transactions
  forceRefundFailure: boolean;
  // Settings
  forceAddressValidationFailure: boolean;
  forceSaveFailure: boolean;
  // Dashboard
  dashboardEmptyState: boolean;
}

const defaultState: DevControlsState = {
  offlineMode: false,
  slowNetwork: false,
  forceLoadingStates: false,
  localStorageUnavailable: false,
  forcePaymentDecline: false,
  forceProcessingTimeout: false,
  forceGatewayError: false,
  forceSendFailure: false,
  forcePaymentPageError: false,
  forceRefundFailure: false,
  forceAddressValidationFailure: false,
  forceSaveFailure: false,
  dashboardEmptyState: false,
};

interface DevControlsContextValue {
  state: DevControlsState;
  toggle: (key: keyof DevControlsState) => void;
  resetAll: () => void;
  activeCount: number;
  isPanelOpen: boolean;
  togglePanel: () => void;
}

const DevControlsCtx = createContext<DevControlsContextValue | null>(null);

export function DevControlsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DevControlsState>(defaultState);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const toggle = useCallback((key: keyof DevControlsState) => {
    setState((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const resetAll = useCallback(() => {
    setState(defaultState);
  }, []);

  const togglePanel = useCallback(() => {
    setIsPanelOpen((prev) => !prev);
  }, []);

  const activeCount = Object.values(state).filter(Boolean).length;

  // Keyboard shortcut: Ctrl+Shift+D
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsPanelOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <DevControlsCtx.Provider value={{ state, toggle, resetAll, activeCount, isPanelOpen, togglePanel }}>
      {children}
    </DevControlsCtx.Provider>
  );
}

export function useDevControls(): DevControlsContextValue {
  const context = useContext(DevControlsCtx);
  if (!context) {
    throw new Error('useDevControls must be used within a DevControlsProvider');
  }
  return context;
}
