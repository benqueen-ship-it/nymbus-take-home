import type { AppState, AppAction } from '@/data/types';
import { generateSeedData } from '@/data/seed';

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_CUSTOMER':
      return { ...state, customers: [...state.customers, action.payload] };

    case 'UPDATE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.map((c) =>
          c.id === action.payload.id
            ? { ...c, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : c
        ),
      };

    case 'ADD_TRANSACTION':
      return { ...state, transactions: [...state.transactions, action.payload] };

    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.payload.id ? { ...t, ...action.payload.updates } : t
        ),
      };

    case 'ADD_INVOICE':
      return { ...state, invoices: [...state.invoices, action.payload] };

    case 'UPDATE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.map((i) =>
          i.id === action.payload.id ? { ...i, ...action.payload.updates } : i
        ),
      };

    case 'UPDATE_MERCHANT':
      return { ...state, merchant: { ...state.merchant, ...action.payload } };

    case 'RESET_DATA':
      return generateSeedData();

    default:
      return state;
  }
}
