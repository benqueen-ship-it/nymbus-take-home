import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  Users,
  FileText,
  TrendingUp,
  Settings,
  X,
} from 'lucide-react';
import { useMerchant } from '@/context/AppStateContext';

const iconMap = {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  Users,
  FileText,
  TrendingUp,
  Settings,
} as const;

const navItems = [
  { path: '/', label: 'Dashboard', icon: 'LayoutDashboard' as const },
  { path: '/terminal', label: 'Virtual Terminal', icon: 'CreditCard' as const },
  { path: '/invoices', label: 'Invoices', icon: 'FileText' as const },
  { path: '/transactions', label: 'Transactions', icon: 'ArrowLeftRight' as const },
  { path: '/customers', label: 'Customers', icon: 'Users' as const },
  { path: '/processing', label: 'Processing', icon: 'TrendingUp' as const },
  { path: '/settings', label: 'Settings', icon: 'Settings' as const },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const merchant = useMerchant();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-3 border-b border-gray-100">
            <div className="flex-1 flex items-center">
              <img
                src="/images/aurapos-logo.png"
                alt="AuraPOS"
                className="h-10 w-auto max-w-[220px] object-contain"
              />
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 lg:hidden"
              aria-label="Close navigation"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = iconMap[item.icon];
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-600 truncate">{merchant.displayName}</p>
            <p className="text-xs text-gray-400 truncate">{merchant.legalName}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
