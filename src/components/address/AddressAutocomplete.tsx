import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Check, AlertCircle, Pencil } from 'lucide-react';
import { useGooglePlaces } from '@/hooks/useGooglePlaces';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { MerchantAddress } from '@/data/types';

interface AddressAutocompleteProps {
  value: MerchantAddress;
  onChange: (address: MerchantAddress) => void;
}

interface Suggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export function AddressAutocomplete({ value, onChange }: AddressAutocompleteProps) {
  const { isAvailable } = useGooglePlaces();
  const [showModal, setShowModal] = useState(false);

  const hasAddress = value.street || value.city || value.state || value.zip;

  return (
    <div>
      {/* Read-only display */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {hasAddress ? (
            <div className="text-sm text-gray-900">
              <p>{value.street}</p>
              <p>{[value.city, value.state, value.zip].filter(Boolean).join(', ')}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No address on file.</p>
          )}
          {value.verified && (
            <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
              <Check size={12} /> Address verified
              {value.verifiedAt && (
                <span className="text-gray-400 ml-1">
                  ({new Date(value.verifiedAt).toLocaleDateString()})
                </span>
              )}
            </p>
          )}
        </div>
        {isAvailable && (
          <Button variant="secondary" size="sm" icon={<Pencil size={14} />} onClick={() => setShowModal(true)}>
            {hasAddress ? 'Edit' : 'Add Address'}
          </Button>
        )}
      </div>

      {!isAvailable && (
        <div className="flex items-center gap-2 mt-3">
          <AlertCircle size={14} className="text-amber-500 shrink-0" />
          <p className="text-xs text-amber-600">
            Google Address Verification unavailable — API key not configured. Address editing is disabled.
          </p>
        </div>
      )}

      {/* Search Modal */}
      <AddressSearchModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentAddress={value}
        onSelect={(address) => {
          onChange(address);
          setShowModal(false);
        }}
      />
    </div>
  );
}

// --- Search Modal ---
interface AddressSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAddress: MerchantAddress;
  onSelect: (address: MerchantAddress) => void;
}

function AddressSearchModal({ isOpen, onClose, onSelect }: AddressSearchModalProps) {
  const { getSuggestions, getPlaceDetails } = useGooglePlaces();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<MerchantAddress | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSuggestions([]);
      setSelectedAddress(null);
    }
  }, [isOpen]);

  const handleSearch = useCallback(
    (input: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setSelectedAddress(null);
      if (!input.trim()) {
        setSuggestions([]);
        return;
      }
      debounceRef.current = setTimeout(async () => {
        const results = await getSuggestions(input);
        setSuggestions(results);
      }, 300);
    },
    [getSuggestions]
  );

  async function handlePick(suggestion: Suggestion) {
    setLoading(true);
    setSuggestions([]);
    setQuery(suggestion.description);
    const details = await getPlaceDetails(suggestion.placeId);
    setLoading(false);

    if (details) {
      setSelectedAddress({
        street: details.street,
        city: details.city,
        state: details.state,
        zip: details.zip,
        verified: true,
        verifiedAt: new Date().toISOString(),
      });
    }
  }

  function handleConfirm() {
    if (selectedAddress) {
      onSelect(selectedAddress);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Business Address" description="Search for your address and select a verified match.">
      <div className="space-y-4">
        {/* Search input */}
        <div className="relative">
          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            placeholder="Start typing an address..."
            className="input-field pl-9"
            autoFocus
          />
          {loading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Loading...</span>
          )}
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <ul className="border border-gray-200 rounded-lg divide-y divide-gray-50 max-h-56 overflow-y-auto">
            {suggestions.map((s) => (
              <li
                key={s.placeId}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handlePick(s)}
              >
                <p className="text-gray-900 font-medium">{s.mainText}</p>
                <p className="text-xs text-gray-500">{s.secondaryText}</p>
              </li>
            ))}
          </ul>
        )}

        {/* Selected address preview */}
        {selectedAddress && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-xs font-medium text-green-700 flex items-center gap-1 mb-2">
              <Check size={12} /> Verified Address
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Input label="Street Address" value={selectedAddress.street} readOnly />
              </div>
              <Input label="City" value={selectedAddress.city} readOnly />
              <div className="grid grid-cols-2 gap-3">
                <Input label="State" value={selectedAddress.state} readOnly />
                <Input label="ZIP" value={selectedAddress.zip} readOnly />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!selectedAddress}>
            Use This Address
          </Button>
        </div>
      </div>
    </Modal>
  );
}
