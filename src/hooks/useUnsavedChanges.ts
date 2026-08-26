import { useEffect } from 'react';

/**
 * Shows the native browser "Leave page?" prompt when the user has unsaved changes
 * and tries to navigate away or close the tab.
 */
export function useUnsavedChanges(hasChanges: boolean) {
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (hasChanges) {
        e.preventDefault();
        // Modern browsers ignore custom messages but require returnValue to be set
        e.returnValue = '';
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);
}
