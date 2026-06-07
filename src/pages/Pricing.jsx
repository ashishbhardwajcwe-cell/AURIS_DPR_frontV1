import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import Button from '../components/Button.jsx';
import { useAuth } from '../lib/auth.jsx';
import { PACK_LIST, formatInr } from '../lib/packs.js';
import { purchasePack } from '../lib/payments.js';
import { colors, fonts, radii, shadows, spacing } from '../styles/theme.js';

const wrapStyle = {
  paddingTop: spacing['2xl'],
  paddingBottom: spacing['3xl'],
};

const headerStyle = {
  marginBottom: spacing.xl,
  maxWidth: '720px',
};

const titleStyle = {
  fontFamily: fonts.heading,
  fontSize: 'clamp(28px, 4vw, 38px)',
  color: colors.textPrimary,
  marginBottom: spacing.sm,
};

const leadStyle = {
  fontFamily: fonts.body,
  fontSize: '15px',
  color: colors.textSecondary,
  lineHeight: 1.6,
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: spacing.lg,
};

const cardStyle = (highlight) => ({
  background: colors.cardBg,
  border: `1px solid ${highlight ? colors.tealPrimary : colors.cardBorder}`,
  borderRadius: radii.lg,
  boxShadow: highlight ? shadows.raised : shadows.card,
  padding: spacing.lg,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.sm,
  position: 'relative',
});

const ribbonStyle = {
  position: 'absolute',
  top: -10,
  right: 16,
  fontFamily: fonts.body,
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: colors.textOnDark,
  background: colors.tealPrimary,
  padding: '4px 10px',
  borderRadius: radii.pill,
};

const labelStyle = {
  fontFamily: fonts.body,
  fontSize: '11.5px',
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: colors.tealDark,
};

const creditsStyle = {
  fontFamily: fonts.heading,
  fontSize: '38px',
  fontWeight: 700,
  color: colors.textPrimary,
  lineHeight: 1.05,
};

const priceStyle = {
  fontFamily: fonts.heading,
  fontSize: '22px',
  fontWeight: 600,
  color: colors.textPrimary,
};

const subtitleStyle = {
  fontFamily: fonts.body,
  fontSize: '13.5px',
  color: colors.textSecondary,
};

const footnoteStyle = {
  fontFamily: fonts.body,
  fontSize: '13px',
  color: colors.textMuted,
  marginTop: spacing.xl,
  maxWidth: '720px',
  lineHeight: 1.6,
};

const linkStyle = {
  fontFamily: fonts.body,
  fontSize: '14px',
  color: colors.tealDark,
  fontWeight: 600,
};

export default function Pricing() {
  const navigate = useNavigate();
  const { profile, isPending } = useAuth();
  const isActive = profile?.status === 'active';

  const [busyPackId, setBusyPackId] = useState(null);
  const [error, setError] = useState(null);
  const [flash, setFlash] = useState(null);

  async function handleBuy(pack) {
    setBusyPackId(pack.id);
    setError(null);
    setFlash(null);
    try {
      const result = await purchasePack({ packId: pack.id });
      const credits = result.creditsAdded ?? pack.credits;
      const balance = result.newBalance;
      setFlash(
        `${credits} credit${credits === 1 ? '' : 's'} added.${
          typeof balance === 'number' ? ` New balance: ${balance}.` : ''
        }`
      );
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      if (err?.cancelled) {
        // Silent — the user closed the modal on purpose.
      } else {
        setError(err.message || 'Could not complete payment.');
      }
    } finally {
      setBusyPackId(null);
    }
  }

  return (
    <div style={wrapStyle}>
      <div className="container">
        <p style={{ marginBottom: spacing.md }}>
          <Link to="/dashboard" style={linkStyle}>
            ← Back to dashboard
          </Link>
        </p>

        <div style={headerStyle}>
          <h1 style={titleStyle}>Top up your credits</h1>
          <p style={leadStyle}>
            Each credit covers one DPR submission. Pay securely via Razorpay
            (UPI, cards, netbanking). Credits never expire within 12 months
            of purchase.
          </p>
        </div>

        {isPending && (
          <Alert variant="warning" title="Your account is pending approval" style={{ marginBottom: spacing.lg }}>
            You&apos;ll be able to purchase credits as soon as your account is
            activated.
          </Alert>
        )}

        {error && (
          <Alert variant="error" title="Payment failed" style={{ marginBottom: spacing.lg }}>
            {error}
          </Alert>
        )}
        {flash && (
          <Alert variant="success" title="Payment received" style={{ marginBottom: spacing.lg }}>
            {flash}
          </Alert>
        )}

        <div style={gridStyle}>
          {PACK_LIST.map((pack) => {
            const busy = busyPackId === pack.id;
            const disabled = !isActive || busyPackId !== null;
            return (
              <article key={pack.id} style={cardStyle(pack.highlight)}>
                {pack.highlight && <span style={ribbonStyle}>Best value</span>}
                <span style={labelStyle}>{pack.label}</span>
                <div style={creditsStyle}>
                  {pack.credits}
                  <span style={{ fontSize: 18, color: colors.textMuted, marginLeft: 6 }}>
                    credit{pack.credits === 1 ? '' : 's'}
                  </span>
                </div>
                <div style={priceStyle}>{formatInr(pack.priceInr)}</div>
                <div style={subtitleStyle}>{pack.subtitle}</div>
                <div style={{ marginTop: 'auto', paddingTop: spacing.md }}>
                  <Button
                    variant={pack.highlight ? 'primary' : 'secondary'}
                    fullWidth
                    onClick={() => handleBuy(pack)}
                    disabled={disabled}
                    loading={busy}
                  >
                    {busy ? 'Working…' : `Buy for ${formatInr(pack.priceInr)}`}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>

        <p style={footnoteStyle}>
          Payments are processed by{' '}
          <a
            href="https://razorpay.com"
            target="_blank"
            rel="noopener noreferrer"
            style={linkStyle}
          >
            Razorpay
          </a>
          . GST invoices are issued from Razorpay&apos;s receipt page. Need a
          larger pack or a custom invoice?{' '}
          <a href="mailto:billing@dpranalyzer.com" style={linkStyle}>
            Email us
          </a>
          .
        </p>
      </div>
    </div>
  );
}
