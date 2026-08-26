import { Menu } from 'lucide-react';
import { useMerchant } from '@/context/AppStateContext';

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const merchant = useMerchant();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      {/* Left: hamburger on mobile + merchant name */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
        <h2 className="text-sm font-semibold text-gray-800 hidden sm:block">
          {merchant.displayName}
        </h2>
      </div>

      {/* Right: profile */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pl-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
            style={{ backgroundColor: merchant.branding.primaryColor }}
          >
            MA
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-700">Merchant Admin</p>
            <p className="text-xs text-gray-400">{merchant.supportEmail}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
