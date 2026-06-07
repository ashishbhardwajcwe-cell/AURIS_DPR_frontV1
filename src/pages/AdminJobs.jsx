import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import Button from '../components/Button.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import StatusFilter from '../components/StatusFilter.jsx';
import { listAllJobs, subscribeToAllJobs } from '../lib/jobs.js';
import { formatDate, formatBytes } from '../lib/format.js';
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

const subTextStyle = {
  fontSize: '12.5px',
  color: colors.textMuted,
  fontWeight: 400,
  marginTop: 2,
};

const openLinkStyle = {
  fontFamily: fonts.body,
  fontSize: '13.5px',
  fontWeight: 600,
  color: colors.tealDark,
};

export default function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAllJobs({ status: filter });
      setJobs(data);
    } catch (err) {
      setError(err.message || 'Could not load jobs.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  // Live updates: any change to any job → reload (cheap given the
  // page size — 200 rows max).
  useEffect(() => {
    const unsubscribe = subscribeToAllJobs(() => load());
    return unsubscribe;
  }, [load]);

  const counts = useMemo(() => {
    if (filter !== null) return null; // filter shows count for current selection only when "All"
    const c = { all: jobs.length };
    for (const j of jobs) c[j.status] = (c[j.status] ?? 0) + 1;
    return c;
  }, [jobs, filter]);

  return (
    <div style={wrapStyle}>
      <div className="container">
        <div style={headerRow}>
          <div>
            <h1 style={titleStyle}>All jobs</h1>
            <p
              style={{
                fontFamily: fonts.body,
                fontSize: '14.5px',
                color: colors.textSecondary,
              }}
            >
              Every DPR across every firm. Click a row to review and deliver.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>

        <StatusFilter value={filter} onChange={setFilter} counts={counts} />

        {error && (
          <Alert variant="error" style={{ marginBottom: spacing.lg }}>
            {error}
          </Alert>
        )}

        <section style={cardStyle}>
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Firm</th>
                  <th style={thStyle}>Project</th>
                  <th style={thStyle}>Submitted</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Size</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && jobs.length === 0 && (
                  <tr>
                    <td style={tdStyle} colSpan={6}>
                      <span style={{ color: colors.textMuted }}>
                        Loading jobs…
                      </span>
                    </td>
                  </tr>
                )}
                {!loading && jobs.length === 0 && (
                  <tr>
                    <td style={tdStyle} colSpan={6}>
                      <span style={{ color: colors.textMuted }}>
                        No jobs match this filter yet.
                      </span>
                    </td>
                  </tr>
                )}
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td style={{ ...tdStyle, maxWidth: 220 }}>
                      <div style={{ fontWeight: 600 }}>
                        {job.profile?.company_name || '—'}
                      </div>
                      <div style={subTextStyle}>
                        {job.profile?.contact_name || job.profile?.email || ''}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, maxWidth: 320 }}>
                      <div style={{ fontWeight: 500 }}>{job.project_name}</div>
                      {job.road_stretch && (
                        <div style={subTextStyle}>{job.road_stretch}</div>
                      )}
                    </td>
                    <td style={tdStyle}>{formatDate(job.submitted_at)}</td>
                    <td style={tdStyle}>
                      <StatusBadge status={job.status} />
                    </td>
                    <td style={tdStyle}>{formatBytes(job.total_size_bytes)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <Link to={`/admin/jobs/${job.id}`} style={openLinkStyle}>
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
