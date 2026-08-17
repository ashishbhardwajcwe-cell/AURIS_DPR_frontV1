import { useState } from 'react';
import Alert from '../components/Alert.jsx';
import { useSettings } from '../lib/settings.jsx';
import { setSetting } from '../lib/admin.js';
import { BRANDS, BRAND_KEYS } from '../config/branding.js';
import { colors, fonts, radii, shadows, spacing } from '../styles/theme.js';

const wrapStyle = {
  paddingTop: spacing['2xl'],
  paddingBottom: spacing['3xl'],
};

const titleStyle = {
  fontFamily: fonts.heading,
  fontSize: 'clamp(26px, 4vw, 34px)',
  color: colors.textPrimary,
  marginBottom: spacing.sm,
};

const leadStyle = {
  fontFamily: fonts.body,
  fontSize: '14.5px',
  color: colors.textSecondary,
  marginBottom: spacing.lg,
  maxWidth: '680px',
  lineHeight: 1.6,
};

const cardStyle = {
  background: colors.cardBg,
  border: `1px solid ${colors.cardBorder}`,
  borderRadius: radii.lg,
  boxShadow: shadows.card,
  padding: spacing.xl,
  marginBottom: spacing.lg,
  maxWidth: '680px',
};

const cardTitleStyle = {
  fontFamily: fonts.heading,
  fontSize: '20px',
  color: colors.textPrimary,
  marginBottom: spacing.xs,
};

const cardBodyStyle = {
  fontFamily: fonts.body,
  fontSize: '14px',
  color: colors.textSecondary,
  lineHeight: 1.6,
  marginBottom: spacing.md,
};

const toggleRowStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing.sm,
  fontFamily: fonts.body,
  fontSize: '15px',
  fontWeight: 500,
  color: colors.textPrimary,
  cursor: 'pointer',
};

const selectStyle = {
  fontFamily: fonts.body,
  fontSize: '14.5px',
  padding: '11px 14px',
  borderRadius: radii.sm,
  border: `1px solid ${colors.cardBorder}`,
  background: '#FFFFFF',
  color: colors.textPrimary,
  minWidth: '260px',
  outline: 'none',
};

const labelStyle = {
  fontFamily: fonts.body,
  fontSize: '13.5px',
  fontWeight: 500,
  color: colors.textPrimary,
  display: 'block',
  marginBottom: '6px',
};

function brandLabel(key) {
  const b = BRANDS[key];
  // e.g. "BRO — Border Roads Organisation"
  const short = key.toUpperCase();
  const org = b?.orgName;
  return org && org.toUpperCase() !== short ? `${short} — ${org}` : short;
}

export default function AdminSettings() {
  const { billingEnabled, brandKey, refreshSettings } = useSettings();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedFlash, setSavedFlash] = useState(false);

  async function save(key, value) {
    setSaving(true);
    setError(null);
    setSavedFlash(false);
    try {
      await setSetting({ key, value });
      // Pull the fresh values into context so this admin sees the change
      // immediately (header, footer, credit UI all re-render).
      await refreshSettings();
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
    } catch (err) {
      setError(err.message || 'Could not save setting.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={wrapStyle}>
      <div className="container">
        <h1 style={titleStyle}>Settings</h1>
        <p style={leadStyle}>
          Runtime controls for this portal. Changes take effect for clients on
          their next page refresh — no redeploy needed. These are operator
          controls and are never visible to departmental users.
        </p>

        {error && (
          <Alert
            variant="error"
            title="Could not save"
            style={{ marginBottom: spacing.lg, maxWidth: 680 }}
          >
            {error}
          </Alert>
        )}
        {savedFlash && (
          <Alert
            variant="success"
            style={{ marginBottom: spacing.lg, maxWidth: 680 }}
          >
            Saved.
          </Alert>
        )}

        {/* --- Billing --- */}
        <section style={cardStyle}>
          <h2 style={cardTitleStyle}>Billing &amp; credits</h2>
          <p style={cardBodyStyle}>
            When enabled, clients see credit balances, the rate card, and
            pricing, and submissions are gated on and deducted from their
            credit balance. When disabled (departmental mode), all credit and
            pricing UI is hidden and no credit is enforced or deducted. The
            credit ledger, Razorpay, and admin credit tools stay intact either
            way.
          </p>
          <label style={toggleRowStyle}>
            <input
              type="checkbox"
              checked={billingEnabled}
              disabled={saving}
              onChange={(e) => save('billing_enabled', e.target.checked)}
            />
            Show credits &amp; billing to clients
          </label>
        </section>

        {/* --- Brand --- */}
        <section style={cardStyle}>
          <h2 style={cardTitleStyle}>Active brand</h2>
          <p style={cardBodyStyle}>
            Selects which brand&apos;s logo and names render across the portal —
            header, footer, landing page, browser tab, and theme colour.
          </p>
          <label htmlFor="brand-select" style={labelStyle}>
            Brand
          </label>
          <select
            id="brand-select"
            value={brandKey}
            disabled={saving}
            onChange={(e) => save('active_brand', e.target.value)}
            style={selectStyle}
          >
            {BRAND_KEYS.map((key) => (
              <option key={key} value={key}>
                {brandLabel(key)}
              </option>
            ))}
          </select>
        </section>
      </div>
    </div>
  );
}
