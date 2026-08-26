import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll the main content area to top on route change
    const main = document.querySelector('main');
    if (main) {
      main.scrollTop = 0;
    }
    // Also scroll window in case it's the window scrolling
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
