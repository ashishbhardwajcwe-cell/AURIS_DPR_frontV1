// Client-side download helpers.
// All download URLs are minted by /api/get-download-url — never derived
// from public Supabase URLs — so each download is authorized, audited,
// and time-limited (10 minutes).

import { supabase } from './supabase.js';

async function getAuthHeader() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('You are not signed in.');
  return { authorization: `Bearer ${session.access_token}` };
}

// Returns { signedUrl, expiresAt, kind }.
// kind: 'report' | 'audio' | 'upload'
// uploadIndex: required when kind='upload'
// forceDownload: true → server sets Content-Disposition: attachment so
//   the browser saves rather than opens (useful for PDFs).
export async function getDownloadUrl({
  jobId,
  kind,
  uploadIndex,
  forceDownload = false,
}) {
  const headers = {
    'content-type': 'application/json',
    ...(await getAuthHeader()),
  };
  const resp = await fetch('/api/get-download-url', {
    method: 'POST',
    headers,
    body: JSON.stringify({ jobId, kind, uploadIndex, forceDownload }),
  });
  if (!resp.ok) {
    let message = `Download URL request failed (${resp.status})`;
    try {
      const json = await resp.json();
      if (json?.error) message = json.error;
    } catch {
      /* not JSON */
    }
    throw new Error(message);
  }
  return resp.json();
}

// Convenience: mints a forced-download URL and triggers the browser to
// open it in a hidden anchor. Good for "Download report" buttons.
export async function downloadToBrowser({ jobId, kind, uploadIndex, filename }) {
  const { signedUrl } = await getDownloadUrl({
    jobId,
    kind,
    uploadIndex,
    forceDownload: true,
  });
  const a = document.createElement('a');
  a.href = signedUrl;
  a.rel = 'noopener noreferrer';
  if (filename) a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
