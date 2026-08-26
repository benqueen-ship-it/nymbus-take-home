const STORAGE_KEY = 'paystream_app_state';

export function loadState<T>(fallback: T): T {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return fallback;
    return JSON.parse(serialized) as T;
  } catch (error) {
    console.warn('[PayStream] Failed to load state from localStorage:', error);
    return fallback;
  }
}

export function saveState<T>(state: T): void {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.warn('[PayStream] Failed to save state to localStorage:', error);
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('[PayStream] Failed to clear localStorage:', error);
  }
}
