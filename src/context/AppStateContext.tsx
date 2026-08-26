import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
  type Dispatch,
} from 'react';
import type { AppState, AppAction } from '@/data/types';
import { appReducer } from './reducer';
import { loadState, saveState } from '@/utils/storage';
import { generateSeedData } from '@/data/seed';

const AppStateContext = createContext<AppState | null>(null);
const AppDispatchContext = createContext<Dispatch<AppAction> | null>(null);

function getInitialState(): AppState {
  const seedData = generateSeedData();
  return loadState<AppState>(seedData);
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, getInitialState);

  // Persist state changes to localStorage
  useEffect(() => {
    saveState(state);
  }, [state]);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppState {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}

export function useAppDispatch(): Dispatch<AppAction> {
  const context = useContext(AppDispatchContext);
  if (!context) {
    throw new Error('useAppDispatch must be used within an AppStateProvider');
  }
  return context;
}

export function useMerchant() {
  const state = useAppState();
  return state.merchant;
}

export function useCustomers() {
  const state = useAppState();
  return state.customers;
}

export function useTransactions() {
  const state = useAppState();
  return state.transactions;
}

export function useInvoices() {
  const state = useAppState();
  return state.invoices;
}
