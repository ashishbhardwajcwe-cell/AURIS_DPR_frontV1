// Upload orchestration.
//   - requestUpload / confirmUpload talk to the two Netlify Functions
//   - uploadFile picks an upload strategy by size:
//       small (≤ 50 MB) → single PUT to the signed URL (XHR for progress)
//       big   (>  50 MB) → TUS resumable so a dropped connection can resume
//
// IMPORTANT: this module NEVER reads file contents — it streams them. The
// portal is intentionally crash-proof against malformed Excel files because
// nothing in this codepath ever opens, parses, or samples them.

import * as tus from 'tus-js-client';
import { supabase } from './supabase.js';
import { RESUMABLE_THRESHOLD } from './uploadLimits.js';

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
      /* response was not JSON */
    }
    const err = new Error(message);
    err.status = resp.status;
    throw err;
  }
  return resp.json();
}

export function requestUpload({ projectName, roadStretch, notes, files }) {
  return callApi('/api/request-upload', {
    projectName,
    roadStretch: roadStretch || null,
    notes: notes || null,
    files: files.map((f) => ({ name: f.name, sizeBytes: f.size })),
  });
}

export function confirmUpload({ jobId, totalSizeBytes }) {
  return callApi('/api/confirm-upload', { jobId, totalSizeBytes });
}

export function cancelUpload({ jobId }) {
  return callApi('/api/cancel-upload', { jobId });
}

// Strategy 1: small files — single PUT via XHR so we get real progress.
// Mirrors what supabase.storage.uploadToSignedUrl does internally, plus
// onprogress wiring.
function uploadSmall({ file, signedUrl, onProgress, signal }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', signedUrl);
    xhr.setRequestHeader(
      'content-type',
      file.type || 'application/octet-stream'
    );
    xhr.setRequestHeader('cache-control', '3600');
    xhr.setRequestHeader('x-upsert', 'false');

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
            `Upload failed (${xhr.status}): ${xhr.responseText || xhr.statusText || 'unknown error'}`
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

// Strategy 2: big files — TUS resumable. Survives flaky networks; chunks at
// 6 MB which matches Supabase's recommended setting.
async function uploadResumable({ file, path, onProgress, signal }) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('You are not signed in.');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('Storage URL is not configured.');
  }

  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: `${supabaseUrl}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${session.access_token}`,
        'x-upsert': 'false',
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: 6 * 1024 * 1024,
      metadata: {
        bucketName: 'dpr-uploads',
        objectName: path,
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
      },
      onError: (err) => reject(err),
      onProgress: (uploaded, total) => {
        onProgress?.(Math.round((uploaded / total) * 100));
      },
      onSuccess: () => {
        onProgress?.(100);
        resolve();
      },
    });

    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          upload.abort(true);
          reject(new Error('Upload cancelled.'));
        },
        { once: true }
      );
    }

    upload.start();
  });
}

export function uploadFile({ file, path, signedUrl, onProgress, signal }) {
  if (file.size > RESUMABLE_THRESHOLD) {
    return uploadResumable({ file, path, onProgress, signal });
  }
  return uploadSmall({ file, signedUrl, onProgress, signal });
}
