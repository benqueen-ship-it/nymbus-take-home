import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState, useAppDispatch } from '@/context/AppStateContext';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { generateId } from '@/utils/format';
import type { Customer } from '@/data/types';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer; // if provided, edit mode
  onCreated?: (id: string) => void; // callback for quick-create flows
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export function CustomerFormModal({ isOpen, onClose, customer, onCreated }: CustomerFormModalProps) {
  const { customers } = useAppState();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isEditMode = !!customer;

  const [form, setForm] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  // Populate form on edit
  useEffect(() => {
    if (customer) {
      setForm({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
      });
    } else {
      setForm({ firstName: '', lastName: '', email: '', phone: '' });
    }
    setErrors({});
  }, [customer, isOpen]);

  function validateEmail() {
    if (!form.email.trim()) {
      setErrors((prev) => ({ ...prev, email: 'Email is required.' }));
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setErrors((prev) => ({ ...prev, email: 'Please enter a valid email address.' }));
    } else {
      const duplicate = customers.find(
        (c) => c.email.toLowerCase() === form.email.toLowerCase().trim() && c.id !== customer?.id
      );
      if (duplicate) {
        setErrors((prev) => ({ ...prev, email: 'A customer with this email already exists.' }));
      } else {
        setErrors((prev) => ({ ...prev, email: undefined }));
      }
    }
  }

  function validatePhone() {
    if (form.phone.trim()) {
      const digits = form.phone.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 11) {
        setErrors((prev) => ({ ...prev, phone: 'Please enter a valid US phone number (10 digits).' }));
      } else {
        setErrors((prev) => ({ ...prev, phone: undefined }));
      }
    } else {
      setErrors((prev) => ({ ...prev, phone: undefined }));
    }
  }

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!form.firstName.trim()) {
      newErrors.firstName = 'First name is required.';
    }
    if (!form.lastName.trim()) {
      newErrors.lastName = 'Last name is required.';
    }
    if (!form.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    } else {
      // Check uniqueness
      const duplicate = customers.find(
        (c) => c.email.toLowerCase() === form.email.toLowerCase().trim() && c.id !== customer?.id
      );
      if (duplicate) {
        newErrors.email = 'A customer with this email already exists.';
      }
    }

    // Phone validation (optional but must be valid if provided)
    if (form.phone.trim()) {
      // Strip non-digit characters for validation
      const digits = form.phone.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 11) {
        newErrors.phone = 'Please enter a valid US phone number (10 digits).';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);

    setTimeout(() => {
      if (isEditMode && customer) {
        dispatch({
          type: 'UPDATE_CUSTOMER',
          payload: {
            id: customer.id,
            updates: {
              firstName: form.firstName.trim(),
              lastName: form.lastName.trim(),
              email: form.email.toLowerCase().trim(),
              phone: form.phone.trim(),
            },
          },
        });
        toast('Customer updated successfully');
      } else {
        const newId = generateId('cust');
        const now = new Date().toISOString();
        const newCustomer: Customer = {
          id: newId,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.toLowerCase().trim(),
          phone: form.phone.trim(),
          status: 'active',
          createdAt: now,
          updatedAt: now,
        };
        dispatch({ type: 'ADD_CUSTOMER', payload: newCustomer });
        toast('Customer created successfully');

        if (onCreated) {
          onCreated(newId);
        } else {
          navigate(`/customers/${newId}`);
        }
      }

      setSaving(false);
      onClose();
    }, 300);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Customer' : 'New Customer'}
      description={isEditMode ? 'Update customer information.' : 'Add a new customer to your directory.'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            error={errors.firstName}
            required
            autoFocus
          />
          <Input
            label="Last Name"
            value={form.lastName}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            error={errors.lastName}
            required
          />
        </div>
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); if (errors.email) setErrors((prev) => ({ ...prev, email: undefined })); }}
          onBlur={validateEmail}
          error={errors.email}
          required
          placeholder="customer@example.com"
        />
        <Input
          label="Phone"
          type="tel"
          value={form.phone}
          onChange={(e) => { setForm((f) => ({ ...f, phone: e.target.value })); if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined })); }}
          onBlur={validatePhone}
          error={errors.phone}
          placeholder="(555) 000-0000"
          helperText="Optional — must be a valid 10-digit US number if provided"
        />

        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {isEditMode ? 'Save Changes' : 'Create Customer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
