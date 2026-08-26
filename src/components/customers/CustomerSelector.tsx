import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, X } from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';
import { CustomerFormModal } from './CustomerFormModal';

interface CustomerSelectorProps {
  value: string | null;
  onChange: (id: string | null) => void;
  optional?: boolean;
  /** If provided, "New Customer" triggers this callback instead of opening its own modal.
   *  Use this when the selector is inside a modal to avoid stacking modals. */
  onRequestCreate?: () => void;
}

export function CustomerSelector({ value, onChange, optional = false, onRequestCreate }: CustomerSelectorProps) {
  const { customers } = useAppState();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeCustomers = customers.filter((c) => c.status === 'active');

  const filtered = search.trim()
    ? activeCustomers.filter(
        (c) =>
          c.firstName.toLowerCase().includes(search.toLowerCase()) ||
          c.lastName.toLowerCase().includes(search.toLowerCase()) ||
          c.email.toLowerCase().includes(search.toLowerCase())
      )
    : activeCustomers;

  const selectedCustomer = customers.find((c) => c.id === value);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlight on filter change
  useEffect(() => {
    setHighlightIndex(0);
  }, [search]);

  function handleSelect(id: string) {
    onChange(id);
    setIsOpen(false);
    setSearch('');
  }

  function handleClear() {
    onChange(null);
    setSearch('');
  }

  function handleCreateNew() {
    setIsOpen(false);
    if (onRequestCreate) {
      // Let parent handle creation (avoids nested modal)
      onRequestCreate();
    } else {
      // Self-contained: open own modal (only when NOT inside another modal)
      setShowCreateModal(true);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, filtered.length));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex === filtered.length) {
          handleCreateNew();
        } else if (filtered[highlightIndex]) {
          handleSelect(filtered[highlightIndex].id);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  }

  function handleCreated(id: string) {
    onChange(id);
    setShowCreateModal(false);
    setSearch('');
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Customer{optional && <span className="text-gray-400 font-normal ml-1">(optional)</span>}
      </label>

      {/* Selected display or input */}
      {selectedCustomer && !isOpen ? (
        <div className="input-field flex items-center justify-between cursor-pointer" onClick={() => setIsOpen(true)}>
          <span className="text-sm text-gray-900">
            {selectedCustomer.firstName} {selectedCustomer.lastName}
            <span className="text-gray-400 ml-1">({selectedCustomer.email})</span>
          </span>
          <div className="flex items-center gap-1">
            {optional && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleClear(); }}
                className="p-0.5 rounded hover:bg-gray-200 text-gray-400"
                aria-label="Clear selection"
              >
                <X size={14} />
              </button>
            )}
            <ChevronDown size={16} className="text-gray-400" />
          </div>
        </div>
      ) : (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={optional ? 'Search customers or leave blank for walk-in...' : 'Search customers...'}
            className="input-field pr-8"
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
          />
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <ul
          className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          role="listbox"
        >
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-sm text-gray-500">No customers found.</li>
          )}
          {filtered.map((c, i) => (
            <li
              key={c.id}
              role="option"
              aria-selected={c.id === value}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                i === highlightIndex ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'
              } ${c.id === value ? 'font-medium' : ''}`}
              onClick={() => handleSelect(c.id)}
              onMouseEnter={() => setHighlightIndex(i)}
            >
              {c.firstName} {c.lastName}
              <span className="text-gray-400 ml-1 text-xs">({c.email})</span>
            </li>
          ))}
          {/* New Customer option */}
          <li
            role="option"
            aria-selected={false}
            className={`px-3 py-2 text-sm cursor-pointer border-t border-gray-100 flex items-center gap-2 ${
              highlightIndex === filtered.length ? 'bg-brand-50 text-brand-700' : 'text-brand-600 hover:bg-gray-50'
            }`}
            onClick={handleCreateNew}
            onMouseEnter={() => setHighlightIndex(filtered.length)}
          >
            <Plus size={14} />
            New Customer
          </li>
        </ul>
      )}

      {/* Self-contained create modal — only used when NOT inside another modal */}
      {!onRequestCreate && (
        <CustomerFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
