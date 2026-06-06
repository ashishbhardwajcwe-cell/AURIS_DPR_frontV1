import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard.jsx';
import FormField from '../components/FormField.jsx';
import Button from '../components/Button.jsx';
import Alert from '../components/Alert.jsx';
import { useAuth } from '../lib/auth.jsx';
import { supabase } from '../lib/supabase.js';
import { spacing } from '../styles/theme.js';

// Shown after a Google OAuth signup where company info is missing. The
// handle_new_user trigger created a profile row but left company_name null;
// this form fills the gap so the operator has something to approve.
export default function CompleteProfile() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile, isAuthenticated, loading } = useAuth();

  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  // Pre-fill anything we already know (e.g. name from Google) so the user
  // doesn't have to retype it.
  useEffect(() => {
    if (profile) {
      setForm((prev) => ({
        companyName: profile.company_name || prev.companyName,
        contactName: profile.contact_name || prev.contactName,
        phone: profile.phone || prev.phone,
      }));
    }
  }, [profile]);

  // Already completed? Hop straight to the dashboard.
  useEffect(() => {
    if (profile && profile.company_name) {
      navigate('/dashboard', { replace: true });
    }
  }, [profile, navigate]);

  const update = (key) => (e) => {
    setForm((p) => ({ ...p, [key]: e.target.value }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  function validate() {
    const v = {};
    if (!form.companyName.trim()) v.companyName = 'Required.';
    if (!form.contactName.trim()) v.contactName = 'Required.';
    if (form.phone && form.phone.replace(/\D/g, '').length < 7) {
      v.phone = 'Please enter a valid phone number.';
    }
    return v;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError(null);
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          company_name: form.companyName.trim(),
          contact_name: form.contactName.trim(),
          phone: form.phone.trim() || null,
        })
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.message || 'Unable to save your profile.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Finish setting up your account"
      subtitle="Tell us a little about your firm so we can activate your workspace."
    >
      {serverError && (
        <Alert variant="error" title="Could not save" style={{ marginBottom: spacing.md }}>
          {serverError}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <FormField
          id="cp-company"
          label="Company / firm name"
          value={form.companyName}
          onChange={update('companyName')}
          required
          autoComplete="organization"
          disabled={submitting}
          placeholder="e.g. Acme Highway Consultants Pvt Ltd"
          error={errors.companyName}
        />
        <FormField
          id="cp-contact"
          label="Your name"
          value={form.contactName}
          onChange={update('contactName')}
          required
          autoComplete="name"
          disabled={submitting}
          error={errors.contactName}
        />
        <FormField
          id="cp-phone"
          label="Phone number"
          type="tel"
          value={form.phone}
          onChange={update('phone')}
          autoComplete="tel"
          placeholder="+91 98765 43210"
          disabled={submitting}
          error={errors.phone}
        />
        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={submitting}
          loading={submitting}
        >
          Save and continue
        </Button>
      </form>
    </AuthCard>
  );
}
