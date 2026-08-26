import { useState } from 'react';
import { Building2, Palette, Receipt, RotateCcw, User } from 'lucide-react';
import { useMerchant, useAppDispatch } from '@/context/AppStateContext';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { AddressAutocomplete } from '@/components/address/AddressAutocomplete';
import type { MerchantSettings } from '@/data/types';

type SettingsTab = 'profile' | 'branding' | 'tax' | 'account';

const tabs: { id: SettingsTab; label: string; icon: typeof Building2 }[] = [
  { id: 'profile', label: 'Business Profile', icon: Building2 },
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'tax', label: 'Tax', icon: Receipt },
  { id: 'account', label: 'My Account', icon: User },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [showResetModal, setShowResetModal] = useState(false);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
      <p className="mt-1 text-sm text-gray-500">Manage your merchant profile and preferences.</p>

      {/* Tab navigation */}
      <div className="mt-6 border-b border-gray-200">
        <nav className="flex gap-6" role="tablist">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'branding' && <BrandingTab />}
        {activeTab === 'tax' && <TaxTab />}
        {activeTab === 'account' && <AccountTab />}
      </div>

      {/* Reset Demo Data */}
      <div className="mt-10 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Reset Demo Data</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Clear all changes and restore original sample data.
            </p>
          </div>
          <Button variant="danger" size="sm" icon={<RotateCcw size={14} />} onClick={() => setShowResetModal(true)}>
            Reset Data
          </Button>
        </div>
      </div>

      <ResetModal isOpen={showResetModal} onClose={() => setShowResetModal(false)} />
    </div>
  );
}

// --- Profile Tab ---
function ProfileTab() {
  const merchant = useMerchant();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [form, setForm] = useState<MerchantSettings>(merchant);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Detect unsaved changes
  const hasChanges = JSON.stringify(form) !== JSON.stringify(merchant);
  useUnsavedChanges(hasChanges);

  function handleChange(field: string, value: string) {
    setForm((prev) => {
      if (field.startsWith('address.')) {
        const addrField = field.replace('address.', '');
        return { ...prev, address: { ...prev.address, [addrField]: value, verified: false } };
      }
      return { ...prev, [field]: value };
    });
    // Clear error on change
    if (errors[field]) {
      setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    }
  }

  function validateField(field: string) {
    const newErrors = { ...errors };
    switch (field) {
      case 'taxId':
        if (form.taxId.trim()) {
          const digits = form.taxId.replace(/\D/g, '');
          if (digits.length !== 9) {
            newErrors['taxId'] = 'Tax ID must be 9 digits (XX-XXXXXXX).';
          } else {
            delete newErrors['taxId'];
          }
        } else {
          delete newErrors['taxId'];
        }
        break;
      case 'website':
        if (form.website.trim() && !/^https?:\/\/.+\..+/.test(form.website.trim())) {
          newErrors['website'] = 'Please enter a valid URL starting with http:// or https://';
        } else {
          delete newErrors['website'];
        }
        break;
      case 'phone':
        if (form.phone.trim()) {
          const digits = form.phone.replace(/\D/g, '');
          if (digits.length < 10 || digits.length > 11) {
            newErrors['phone'] = 'Please enter a valid 10-digit US phone number.';
          } else {
            delete newErrors['phone'];
          }
        } else {
          delete newErrors['phone'];
        }
        break;
      case 'supportEmail':
        if (form.supportEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.supportEmail.trim())) {
          newErrors['supportEmail'] = 'Please enter a valid email address.';
        } else {
          delete newErrors['supportEmail'];
        }
        break;
    }
    setErrors(newErrors);
  }

  const hasErrors = Object.keys(errors).length > 0;

  function handleSave() {
    // Run all validations
    validateField('taxId');
    validateField('website');
    validateField('phone');
    validateField('supportEmail');

    // Re-check after validation
    const finalErrors: Record<string, string> = {};
    if (form.taxId.trim() && form.taxId.replace(/\D/g, '').length !== 9) {
      finalErrors['taxId'] = 'Tax ID must be 9 digits.';
    }
    if (form.website.trim() && !/^https?:\/\/.+\..+/.test(form.website.trim())) {
      finalErrors['website'] = 'Please enter a valid URL.';
    }
    if (form.phone.trim()) {
      const digits = form.phone.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 11) finalErrors['phone'] = 'Invalid phone number.';
    }
    if (form.supportEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.supportEmail.trim())) {
      finalErrors['supportEmail'] = 'Invalid email address.';
    }

    if (Object.keys(finalErrors).length > 0) {
      setErrors(finalErrors);
      toast('Please fix validation errors before saving.', 'error');
      return;
    }

    setSaving(true);
    setTimeout(() => {
      dispatch({ type: 'UPDATE_MERCHANT', payload: form });
      setSaving(false);
      toast('Settings saved successfully');
    }, 500);
  }

  return (
    <Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Legal Business Name"
          value={form.legalName}
          onChange={(e) => handleChange('legalName', e.target.value)}
        />
        <Input
          label="Display Name (DBA)"
          value={form.displayName}
          onChange={(e) => handleChange('displayName', e.target.value)}
          required
          helperText="Shown to customers and in the navigation"
        />
        <Input
          label="Tax ID (EIN)"
          value={form.taxId}
          onChange={(e) => {
            // Strip non-digits, auto-format with hyphen
            const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
            const formatted = digits.length > 2 ? digits.slice(0, 2) + '-' + digits.slice(2) : digits;
            handleChange('taxId', formatted);
          }}
          onBlur={() => validateField('taxId')}
          error={errors['taxId']}
          placeholder="XX-XXXXXXX"
          helperText="9-digit EIN — hyphen inserted automatically"
          maxLength={10}
        />
        <Input
          label="Website"
          type="url"
          value={form.website}
          onChange={(e) => handleChange('website', e.target.value)}
          onBlur={() => validateField('website')}
          error={errors['website']}
          placeholder="https://"
        />
        <Input
          label="Phone"
          type="tel"
          value={form.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          onBlur={() => validateField('phone')}
          error={errors['phone']}
          placeholder="(555) 000-0000"
        />
        <Input
          label="Support Email"
          type="email"
          value={form.supportEmail}
          onChange={(e) => handleChange('supportEmail', e.target.value)}
          onBlur={() => validateField('supportEmail')}
          error={errors['supportEmail']}
        />
      </div>

      {/* Address section — editable via Google verification */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Business Address</h3>
        <AddressAutocomplete
          value={form.address}
          onChange={(address) => setForm((prev) => ({ ...prev, address }))}
        />
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} loading={saving} disabled={hasErrors}>Save Changes</Button>
      </div>
    </Card>
  );
}

// --- Branding Tab ---
function BrandingTab() {
  const merchant = useMerchant();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [primary, setPrimary] = useState(merchant.branding.primaryColor);
  const [secondary, setSecondary] = useState(merchant.branding.secondaryColor);
  const [logoUrl, setLogoUrl] = useState(merchant.branding.logoUrl);
  const [saving, setSaving] = useState(false);

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      dispatch({
        type: 'UPDATE_MERCHANT',
        payload: { branding: { primaryColor: primary, secondaryColor: secondary, logoUrl } },
      });
      setSaving(false);
      toast('Branding updated');
    }, 500);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Brand Colors</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                className="input-field w-28 font-mono text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={secondary}
                onChange={(e) => setSecondary(e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={secondary}
                onChange={(e) => setSecondary(e.target.value)}
                className="input-field w-28 font-mono text-sm"
              />
            </div>
          </div>
          <div>
            <Input
              label="Logo URL"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              helperText="Leave blank to use the default initial-based logo"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} loading={saving}>Save Branding</Button>
        </div>
      </Card>

      {/* Preview */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Preview</h3>
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          {/* Invoice header preview */}
          <div className="p-4" style={{ backgroundColor: primary }}>
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded" />
              ) : (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: secondary }}>
                  {merchant.displayName.charAt(0)}
                </div>
              )}
              <span className="font-semibold text-white">{merchant.displayName}</span>
            </div>
          </div>
          <div className="p-4 bg-white">
            <p className="text-sm text-gray-600">Invoice #INV-001</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">$1,250.00</p>
            <p className="text-xs text-gray-500 mt-2">Due: Sept 15, 2026</p>
            <button
              className="mt-3 w-full py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: primary }}
            >
              View and Pay Invoice
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// --- Tax Tab ---
function TaxTab() {
  const merchant = useMerchant();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [config, setConfig] = useState(merchant.taxConfig);
  const [saving, setSaving] = useState(false);

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      dispatch({ type: 'UPDATE_MERCHANT', payload: { taxConfig: config } });
      setSaving(false);
      toast('Tax configuration saved');
    }, 500);
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Tax Rate Configuration</h3>
      <div className="max-w-md space-y-4">
        <Input
          label="Tax Name"
          value={config.name}
          onChange={(e) => setConfig((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Sales Tax"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={(config.rate * 100).toFixed(2)}
              onChange={(e) => setConfig((prev) => ({ ...prev, rate: parseFloat(e.target.value) / 100 || 0 }))}
              className="input-field w-32"
            />
            <span className="text-sm text-gray-500 font-medium">
              {config.name}: {(config.rate * 100).toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabledForTerminal}
              onChange={(e) => setConfig((prev) => ({ ...prev, enabledForTerminal: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm text-gray-700">Apply to Virtual Terminal payments</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabledForInvoices}
              onChange={(e) => setConfig((prev) => ({ ...prev, enabledForInvoices: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm text-gray-700">Apply to Invoices</span>
          </label>
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} loading={saving}>Save Tax Configuration</Button>
      </div>
    </Card>
  );
}

// --- Account Tab ---
function AccountTab() {
  const { toast } = useToast();
  const [name, setName] = useState('Merchant Admin');
  const [email, setEmail] = useState('admin@riversideservices.com');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  function validateEmail() {
    if (!email.trim()) {
      setErrors((prev) => ({ ...prev, email: 'Email is required.' }));
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrors((prev) => ({ ...prev, email: 'Please enter a valid email address.' }));
    } else {
      setErrors((prev) => { const n = { ...prev }; delete n['email']; return n; });
    }
  }

  function handleSave() {
    validateEmail();
    if (!name.trim()) {
      setErrors((prev) => ({ ...prev, name: 'Name is required.' }));
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return;

    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast('Account settings saved');
    }, 500);
  }

  function handleResetPassword() {
    setShowPasswordModal(false);
    toast('Password reset email sent (simulated)');
  }

  return (
    <>
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">User Profile</h3>
        <div className="max-w-md space-y-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => { setName(e.target.value); if (errors['name']) setErrors((prev) => { const n = { ...prev }; delete n['name']; return n; }); }}
            error={errors['name']}
            required
          />
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (errors['email']) setErrors((prev) => { const n = { ...prev }; delete n['email']; return n; }); }}
            onBlur={validateEmail}
            error={errors['email']}
            required
            helperText="Used for login and notifications"
          />
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} loading={saving} disabled={Object.keys(errors).length > 0}>
            Save Account
          </Button>
        </div>
      </Card>

      <Card className="mt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Security</h3>
        <p className="text-sm text-gray-500 mb-4">Manage your account security.</p>
        <Button variant="secondary" onClick={() => setShowPasswordModal(true)}>
          Reset Password
        </Button>
      </Card>

      {/* Password Reset Modal */}
      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Reset Password" size="sm">
        <p className="text-sm text-gray-600 mb-4">
          We'll send a password reset link to <span className="font-medium">{email}</span>. You'll be able to set a new password from the link in the email.
        </p>
        <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded mb-4">
          This is a simulated action — no actual email will be sent in this prototype.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>Cancel</Button>
          <Button onClick={handleResetPassword}>Send Reset Link</Button>
        </div>
      </Modal>
    </>
  );
}

// --- Reset Modal ---
function ResetModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  function handleReset() {
    dispatch({ type: 'RESET_DATA' });
    toast('Demo data has been reset');
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reset Demo Data" size="sm">
      <p className="text-sm text-gray-600 mb-4">
        This will clear all your changes (customers, transactions, invoices, settings) and restore the original sample data. This action cannot be undone.
      </p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={handleReset}>Reset All Data</Button>
      </div>
    </Modal>
  );
}
