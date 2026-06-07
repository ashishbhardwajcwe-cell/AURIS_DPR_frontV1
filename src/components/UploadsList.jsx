import { useState } from 'react';
import Alert from './Alert.jsx';
import Button from './Button.jsx';
import { downloadToBrowser } from '../lib/downloads.js';
import { colors, fonts, radii, spacing } from '../styles/theme.js';

// Renders the list of files the client uploaded for one job. Each row
// has a download button that mints a fresh signed URL via
// /api/get-download-url (kind='upload', admin-only).
export default function UploadsList({ jobId, paths }) {
  const [error, setError] = useState(null);
  const [busyIndex, setBusyIndex] = useState(null);

  if (!Array.isArray(paths) || paths.length === 0) {
    return (
      <p
        style={{
          fontFamily: fonts.body,
          fontSize: '14px',
          color: colors.textMuted,
        }}
      >
        No files attached to this job.
      </p>
    );
  }

  async function handleDownload(idx, path) {
    setBusyIndex(idx);
    setError(null);
    try {
      const filename = path.split('/').pop() || `upload-${idx + 1}`;
      await downloadToBrowser({
        jobId,
        kind: 'upload',
        uploadIndex: idx,
        filename,
      });
    } catch (err) {
      setError(err.message || 'Download failed.');
    } finally {
      setBusyIndex(null);
    }
  }

  return (
    <div>
      {error && <Alert variant="error" style={{ marginBottom: spacing.sm }}>{error}</Alert>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        {paths.map((path, idx) => {
          const filename = path.split('/').pop() || path;
          return (
            <div
              key={`${path}-${idx}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: spacing.md,
                padding: `${spacing.sm} ${spacing.md}`,
                background: '#FFFFFF',
                border: `1px solid ${colors.cardBorder}`,
                borderRadius: radii.sm,
              }}
            >
              <span
                style={{
                  fontFamily: fonts.body,
                  fontSize: '14px',
                  color: colors.textPrimary,
                  fontWeight: 500,
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={filename}
              >
                {filename}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDownload(idx, path)}
                disabled={busyIndex === idx}
                loading={busyIndex === idx}
              >
                Download
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
