import { useCallback, useEffect, useMemo, useState } from 'react';
import Alert from '../components/Alert.jsx';
import Button from '../components/Button.jsx';
import FormField from '../components/FormField.jsx';
import Modal from '../components/Modal.jsx';
import { useAuth } from '../lib/auth.jsx';
import { grantCredits, setProfileStatus } from '../lib/admin.js';
import { listAllProfiles } from '../lib/profiles.js';
import { getBalancesForUsers } from '../lib/credits.js';
import { formatDate } from '../lib/format.js';
import { colors, fonts, radii, shadows, spacing } from '../styles/theme.js';

const wrapStyle = {
  paddingTop: spacing['2xl'],
  paddingBottom: spacing['3xl'],
};

const headerRow = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: spacing.md,
  marginBottom: spacing.lg,
};

const titleStyle = {
  fontFamily: fonts.heading,
  fontSize: 'clamp(26px, 4vw, 34px)',
  color: colors.textPrimary,
};

const cardStyle = {
  background: colors.cardBg,
  border: `1px solid ${colors.cardBorder}`,
  borderRadius: radii.lg,
  boxShadow: shadows.card,
  overflow: 'hidden',
};

const tableWrapStyle = { width: '100%', overflowX: 'auto' };

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: fonts.body,
  fontSize: '14px',
};

const thStyle = {
  textAlign: 'left',
  fontWeight: 600,
  fontSize: '12px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: colors.textMuted,
  padding: `${spacing.sm} ${spacing.lg}`,
  background: '#FAFBFC',
  borderBottom: `1px solid ${colors.cardBorder}`,
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: `${spacing.md} ${spacing.lg}`,
  borderBottom: `1px solid #F1F5F9`,
  color: colors.textPrimary,
  verticalAlign: 'middle',
};

const subText = {
  fontSize: '12.5px',
  color: colors.textMuted,
  fontWeight: 400,
  marginTop: 2,
};

const statusPill = (status) => {
  const map = {
    pending:   { bg: '#FFFBEB', border: '#FCD34D', color: '#92400E', label: 'Pending' },
    active:    { bg: '#ECFDF5', border: '#A7F3D0', color: '#065F46', label: 'Active' },
    suspended: { bg: '#FEF2F2', border: '#FCA5A5', color: '#991B1B', label: 'Suspended' },
  };
  const m = map[status] ?? map.pending;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 999,
        background: m.bg,
        border: `1px solid ${m.border}`,
        color: m.color,
        fontFamily: fonts.body,
        fontSize: '11.5px',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}
    >
      {m.label}
    </span>
  );
};

export default function AdminClients() {
  const { user: adminUser } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionBusyId, setActionBusyId] = useState(null);
  const [flash, setFlash] = useState(null);

  const [grantOpen, setGrantOpen] = useState(false);
  const [grantTarget, setGrantTarget] = useState(null);
  const [grantAmount, setGrantAmount] = useState('5');
  const [grantReason, setGrantReason] = useState('grant');
  const [grantSubmitting, setGrantSubmitting] = useState(false);
  const [grantError, setGrantError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ps = await listAllProfiles();
      setProfiles(ps);
      const ids = ps.map((p) => p.id);
      const b = await getBalancesForUsers(ids);
      setBalances(b);
    } catch (err) {
      setError(err.message || 'Could not load clients.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleStatus(profile, status) {
    setActionBusyId(profile.id);
    setError(null);
    setFlash(null);
    try {
      await setProfileStatus({ userId: profile.id, status });
      setFlash(`${profile.company_name || profile.email} → ${status}`);
      await load();
    } catch (err) {
      setError(err.message || 'Could not update status.');
    } finally {
      setActionBusyId(null);
    }
  }

  function openGrant(profile) {
    setGrantTarget(profile);
    setGrantAmount('5');
    setGrantReason('grant');
    setGrantError(null);
    setGrantOpen(true);
  }

  async function submitGrant(e) {
    e.preventDefault();
    setGrantError(null);
    const delta = Number(grantAmount);
    if (!Number.isInteger(delta) || delta === 0) {
      setGrantError('Amount must be a non-zero integer.');
      return;
    }
    setGrantSubmitting(true);
    try {
      await grantCredits({
        userId: grantTarget.id,
        delta,
        reason: grantReason,
      });
      setGrantOpen(false);
      setFlash(
        `${delta > 0 ? '+' : ''}${delta} credits → ${
          grantTarget.company_name || grantTarget.email
        } (${grantReason})`
      );
      await load();
    } catch (err) {
      setGrantError(err.message || 'Could not grant credits.');
    } finally {
      setGrantSubmitting(false);
    }
  }

  const counts = useMemo(() => {
    const c = { all: profiles.length, pending: 0, active: 0, suspended: 0 };
    for (const p of profiles) {
      c[p.status] = (c[p.status] ?? 0) + 1;
    }
    return c;
  }, [profiles]);

  return (
    <div style={wrapStyle}>
      <div className="container">
        <div style={headerRow}>
          <div>
            <h1 style={titleStyle}>Clients</h1>
            <p
              style={{
                fontFamily: fonts.body,
                fontSize: '14.5px',
                color: colors.textSecondary,
              }}
            >
              {counts.all} firm{counts.all === 1 ? '' : 's'} ·{' '}
              {counts.active} active · {counts.pending} pending ·{' '}
              {counts.suspended} suspended
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>

        {error && <Alert variant="error" style={{ marginBottom: spacing.lg }}>{error}</Alert>}
        {flash && <Alert variant="success" style={{ marginBottom: spacing.lg }}>{flash}</Alert>}

        <section style={cardStyle}>
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Firm</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Balance</th>
                  <th style={thStyle}>Joined</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && profiles.length === 0 && (
                  <tr>
                    <td style={tdStyle} colSpan={6}>
                      <span style={{ color: colors.textMuted }}>Loading…</span>
                    </td>
                  </tr>
                )}
                {!loading && profiles.length === 0 && (
                  <tr>
                    <td style={tdStyle} colSpan={6}>
                      <span style={{ color: colors.textMuted }}>
                        No firms have signed up yet.
                      </span>
                    </td>
                  </tr>
                )}
                {profiles.map((p) => {
                  const isMe = p.id === adminUser?.id;
                  const busy = actionBusyId === p.id;
                  return (
                    <tr key={p.id}>
                      <td style={{ ...tdStyle, maxWidth: 240 }}>
                        <div style={{ fontWeight: 600 }}>
                          {p.company_name || '—'}
                          {p.role === 'admin' && (
                            <span
                              style={{
                                marginLeft: 8,
                                fontSize: '10.5px',
                                fontWeight: 600,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                color: colors.tealDark,
                                background: 'rgba(13,148,136,0.1)',
                                padding: '2px 7px',
                                borderRadius: 999,
                              }}
                            >
                              Admin
                            </span>
                          )}
                        </div>
                        <div style={subText}>
                          {p.contact_name || '—'}
                          {p.phone ? ` · ${p.phone}` : ''}
                        </div>
                      </td>
                      <td style={tdStyle}>{p.email}</td>
                      <td style={tdStyle}>{statusPill(p.status)}</td>
                      <td
                        style={{
                          ...tdStyle,
                          fontVariantNumeric: 'tabular-nums',
                          fontWeight: 600,
                        }}
                      >
                        {balances[p.id] ?? 0}
                      </td>
                      <td style={tdStyle}>{formatDate(p.created_at)}</td>
                      <td
                        style={{
                          ...tdStyle,
                          textAlign: 'right',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <div
                          style={{
                            display: 'inline-flex',
                            gap: 6,
                            flexWrap: 'wrap',
                            justifyContent: 'flex-end',
                          }}
                        >
                          {p.status !== 'active' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleStatus(p, 'active')}
                              disabled={busy || isMe}
                            >
                              Approve
                            </Button>
                          )}
                          {p.status === 'active' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleStatus(p, 'suspended')}
                              disabled={busy || isMe}
                            >
                              Suspend
                            </Button>
                          )}
                          {p.status === 'suspended' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleStatus(p, 'active')}
                              disabled={busy || isMe}
                            >
                              Reactivate
                            </Button>
                          )}
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => openGrant(p)}
                            disabled={busy}
                          >
                            Grant
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <Modal
        open={grantOpen}
        onClose={() => !grantSubmitting && setGrantOpen(false)}
        title="Grant credits"
        subtitle={
          grantTarget
            ? `${grantTarget.company_name || grantTarget.email} · balance ${
                balances[grantTarget.id] ?? 0
              }`
            : ''
        }
      >
        <form onSubmit={submitGrant}>
          <FormField
            id="grant-amount"
            label="Amount"
            type="number"
            value={grantAmount}
            onChange={(e) => setGrantAmount(e.target.value)}
            required
            disabled={grantSubmitting}
            hint="Positive to add, negative to take away. Whole numbers only."
          />
          <div style={{ marginBottom: spacing.md }}>
            <label
              htmlFor="grant-reason"
              style={{
                fontFamily: fonts.body,
                fontSize: '13.5px',
                fontWeight: 500,
                color: colors.textPrimary,
                display: 'block',
                marginBottom: 6,
              }}
            >
              Reason
            </label>
            <select
              id="grant-reason"
              value={grantReason}
              onChange={(e) => setGrantReason(e.target.value)}
              disabled={grantSubmitting}
              style={{
                fontFamily: fonts.body,
                fontSize: '15px',
                padding: '11px 14px',
                borderRadius: radii.sm,
                border: `1px solid ${colors.cardBorder}`,
                background: '#FFFFFF',
                color: colors.textPrimary,
                width: '100%',
                outline: 'none',
              }}
            >
              <option value="grant">Grant (trial / goodwill)</option>
              <option value="razorpay_purchase">Razorpay purchase (Phase 2)</option>
              <option value="refund">Refund</option>
              <option value="expiry">Expiry write-off</option>
            </select>
          </div>
          {grantError && (
            <Alert variant="error" style={{ marginBottom: spacing.md }}>
              {grantError}
            </Alert>
          )}
          <div
            style={{
              display: 'flex',
              gap: spacing.sm,
              justifyContent: 'flex-end',
            }}
          >
            <Button
              type="button"
              variant="secondary"
              onClick={() => setGrantOpen(false)}
              disabled={grantSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={grantSubmitting}
              loading={grantSubmitting}
            >
              Write to ledger
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
