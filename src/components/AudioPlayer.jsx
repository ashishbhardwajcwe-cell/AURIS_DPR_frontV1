import { useEffect, useState } from 'react';
import Alert from './Alert.jsx';
import Button from './Button.jsx';
import { getDownloadUrl, downloadToBrowser } from '../lib/downloads.js';
import { colors, fonts, radii, spacing } from '../styles/theme.js';

// Inline audio player for the podcast-style overview that ships with
// every completed job.
//
// We mint the streaming URL on mount via /api/get-download-url so each
// playback is authenticated and audited. The URL is good for 10 minutes;
// if it expires mid-listen the user can hit "Refresh" to mint a new one.
//
// Download uses a separate forced-download URL so the browser saves
// instead of opening.
export default function AudioPlayer({ jobId, filename }) {
  const [signedUrl, setSignedUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  async function loadStreamUrl() {
    setLoading(true);
    setError(null);
    try {
      const { signedUrl: url } = await getDownloadUrl({
        jobId,
        kind: 'audio',
      });
      setSignedUrl(url);
    } catch (err) {
      setError(err.message || 'Could not load the audio.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStreamUrl();
    // We intentionally do not include loadStreamUrl in deps — it's a
    // stable function-by-closure and we only need to re-fetch when
    // jobId changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadToBrowser({
        jobId,
        kind: 'audio',
        filename: filename || `dpr-audio-overview-${jobId}.mp3`,
      });
    } catch (err) {
      setError(err.message || 'Could not download the audio.');
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          fontFamily: fonts.body,
          fontSize: '14px',
          color: colors.textMuted,
          padding: spacing.md,
        }}
      >
        Loading audio…
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Alert variant="error">{error}</Alert>
        <div style={{ marginTop: spacing.sm }}>
          <Button variant="secondary" size="sm" onClick={loadStreamUrl}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
      }}
    >
      <audio
        controls
        src={signedUrl}
        preload="metadata"
        style={{
          width: '100%',
          height: 44,
          borderRadius: radii.sm,
        }}
      >
        Your browser does not support audio playback.
      </audio>
      <div
        style={{
          display: 'flex',
          gap: spacing.sm,
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: '12.5px',
            color: colors.textMuted,
          }}
        >
          The streaming link is valid for 10 minutes. Refresh if it stops
          mid-play.
        </span>
        <div style={{ display: 'flex', gap: spacing.sm }}>
          <Button variant="ghost" size="sm" onClick={loadStreamUrl}>
            Refresh link
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleDownload}
            disabled={downloading}
            loading={downloading}
          >
            Download audio
          </Button>
        </div>
      </div>
    </div>
  );
}
