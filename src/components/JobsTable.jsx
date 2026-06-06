import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';
import EmptyState from './EmptyState.jsx';
import Button from './Button.jsx';
import { formatDate, formatBytes } from '../lib/format.js';
import { colors, fonts, radii, shadows, spacing } from '../styles/theme.js';

const cardStyle = {
  background: colors.cardBg,
  border: `1px solid ${colors.cardBorder}`,
  borderRadius: radii.lg,
  boxShadow: shadows.card,
  overflow: 'hidden',
};

const headerRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${spacing.md} ${spacing.lg}`,
  borderBottom: `1px solid ${colors.cardBorder}`,
};

const titleStyle = {
  fontFamily: fonts.heading,
  fontSize: '18px',
  color: colors.textPrimary,
  margin: 0,
};

const tableWrapStyle = {
  width: '100%',
  overflowX: 'auto',
};

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

const projectCellStyle = {
  ...tdStyle,
  fontWeight: 600,
  maxWidth: '320px',
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

export default function JobsTable({
  jobs,
  loading,
  onRefresh,
  onUpload,
  canUpload,
}) {
  const showEmpty = !loading && jobs.length === 0;

  return (
    <section style={cardStyle} aria-label="Your DPR jobs">
      <div style={headerRowStyle}>
        <h2 style={titleStyle}>Your DPR jobs</h2>
        {onRefresh && (
          <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        )}
      </div>

      {showEmpty ? (
        <EmptyState
          title="No DPRs yet"
          actions={
            canUpload && onUpload ? (
              <Button variant="primary" onClick={onUpload}>
                Upload a DPR
              </Button>
            ) : null
          }
        >
          When you upload a DPR, it will appear here with its analysis
          status. Reports and audio overviews show up here once they&apos;re
          ready.
        </EmptyState>
      ) : (
        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
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
                  <td style={tdStyle} colSpan={5}>
                    <span style={{ color: colors.textMuted }}>Loading jobs…</span>
                  </td>
                </tr>
              )}
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td style={projectCellStyle}>
                    <div>{job.project_name}</div>
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
                    <Link to={`/jobs/${job.id}`} style={openLinkStyle}>
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
