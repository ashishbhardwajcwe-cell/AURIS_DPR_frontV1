// Admin API client.
// All state-changing operations go through Netlify Functions using the
// service-role key — never the browser's Supabase session — so the audit
// trail is consistent regardless of which admin is acting.

import { supabase } from './supabase.js';

async function getAuthHeader() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('You are not signed in.');
  return { authorization: `Bearer ${session.access_token}` };
}

async function callApi(path, body) {
  const headers = {
    'content-type': 'application/json',
    ...(await getAuthHeader()),
  };
  const resp = await fetch(path, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    let message = `Request failed (${resp.status})`;
    try {
      const json = await resp.json();
      if (json?.error) message = json.error;
    } catch {
      /* not JSON */
    }
    const err = new Error(message);
    err.status = resp.status;
    throw err;
  }
  return resp.json();
}

// Persists changes to a job: status, summary, and the report/audio paths
// after a successful deliverable upload. The server handles:
//   - completed_at stamping
//   - automatic +1 refund on flip to 'failed' (idempotent)
//   - automatic notify-completed email when notify=true and status='completed'
export function saveJob({
  jobId,
  status,
  operatorSummary,
  reportPath,
  audioPath,
  notify = false,
}) {
  return callApi('/api/admin/save-job', {
    jobId,
    status,
    operatorSummary,
    reportPath,
    audioPath,
    notify,
  });
}

// Mints a signed upload URL for the operator to upload a report PDF or
// audio MP3 into dpr-reports/{user_id}/{job_id}/{kind}-{safe_filename}.
export function getDeliverableUploadUrl({ jobId, kind, filename }) {
  return callApi('/api/admin/upload-deliverable-url', {
    jobId,
    kind,
    filename,
  });
}

// Inserts a row into credit_ledger. delta must be a non-zero integer;
// reason must be one of the check-constrained values.
export function grantCredits({ userId, delta, reason }) {
  return callApi('/api/admin/grant-credits', { userId, delta, reason });
}

export function setProfileStatus({ userId, status }) {
  return callApi('/api/admin/set-profile-status', { userId, status });
}

// Uploads a single deliverable file to dpr-reports via the signed URL.
// Small file path — admin deliverables (PDF report, MP3 audio) are
// typically << 50 MB so a single PUT with XHR progress is sufficient.
export function uploadDeliverable({ file, signedUrl, onProgress, signal }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', signedUrl);
    xhr.setRequestHeader(
      'content-type',
      file.type || 'application/octet-stream'
    );
    xhr.setRequestHeader('cache-control', '3600');
    xhr.setRequestHeader('x-upsert', 'true');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress?.(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
      } else {
        reject(
          new Error(
            `Deliverable upload failed (${xhr.status}): ${xhr.responseText || xhr.statusText}`
          )
        );
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload.'));
    xhr.onabort = () => reject(new Error('Upload cancelled.'));
    if (signal) {
      signal.addEventListener('abort', () => xhr.abort(), { once: true });
    }
    xhr.send(file);
  });
}
