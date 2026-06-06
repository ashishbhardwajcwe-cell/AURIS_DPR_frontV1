import { useState } from 'react';
import Button from './Button.jsx';
import Alert from './Alert.jsx';
import { downloadToBrowser } from '../lib/downloads.js';
import { colors, fonts, spacing } from '../styles/theme.js';

// Lightweight download button + error surface for the PDF report.
// Mints a forced-download signed URL on click so the browser saves
// rather than rendering the PDF inline.
export default function ReportDownloadCard({ jobId, filename }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleClick() {
    setBusy(true);
    setError(null);
    try {
      await downloadToBrowser({
        jobId,
        kind: 'report',
        filename: filename || `dpr-compliance-report-${jobId}.pdf`,
      });
    } catch (err) {
      setError(err.message || 'Could not download the report.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm,
      }}
    >
      <p
        style={{
          fontFamily: fonts.body,
          fontSize: '14px',
          color: colors.textSecondary,
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        Your compliance report (PDF) is ready. The download link is valid
        for 10 minutes; if it expires, click again to mint a fresh one.
      </p>

      {error && <Alert variant="error">{error}</Alert>}

      <div>
        <Button
          variant="primary"
          size="lg"
          onClick={handleClick}
          disabled={busy}
          loading={busy}
        >
          Download report (PDF)
        </Button>
      </div>
    </div>
  );
}
