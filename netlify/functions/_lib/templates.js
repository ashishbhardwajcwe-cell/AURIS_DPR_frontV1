// Branded transactional email templates.
// Email HTML is finicky (no flex, inline styles only, table-based layout
// for Outlook). These templates are deliberately plain and use only
// widely-supported markup.

export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatBytes(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(1)} GB`;
  if (n >= 1024 ** 2) return `${(n / 1024 ** 2).toFixed(0)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${n} B`;
}

const COLORS = {
  navy900: '#1A1A2E',
  navy700: '#0F3460',
  teal: '#0D9488',
  text: '#0F172A',
  textMuted: '#475569',
  bg: '#F5F7FA',
  cardBg: '#FFFFFF',
  border: '#E2E8F0',
};

// Shared shell. `heading` is the H1, `intro` is one short paragraph,
// `bodyHtml` is freeform (sanitize before passing in), CTA optional.
export function brandedEmailHtml({
  preheader,
  heading,
  intro,
  bodyHtml,
  ctaLabel,
  ctaUrl,
  footnote,
}) {
  const cta =
    ctaLabel && ctaUrl
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px 0;">
          <tr><td bgcolor="${COLORS.teal}" style="border-radius:8px;">
            <a href="${escapeHtml(ctaUrl)}" target="_blank" rel="noopener"
               style="display:inline-block;padding:12px 24px;font-family:Outfit,Arial,sans-serif;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:8px;">
              ${escapeHtml(ctaLabel)}
            </a>
          </td></tr>
        </table>`
      : '';

  const foot = footnote
    ? `<p style="margin:16px 0 0 0;font-family:Outfit,Arial,sans-serif;font-size:12px;color:${COLORS.textMuted};line-height:1.55;">
         ${footnote}
       </p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light only" />
  <title>${escapeHtml(heading || 'DPR Analyzer Pro')}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.bg};">
  <span style="display:none !important;visibility:hidden;opacity:0;height:0;width:0;font-size:1px;line-height:1px;color:${COLORS.bg};">
    ${escapeHtml(preheader || '')}
  </span>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${COLORS.bg};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">
        <tr>
          <td style="padding:0 0 16px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:linear-gradient(135deg, ${COLORS.navy900} 0%, ${COLORS.navy700} 100%);border-radius:14px 14px 0 0;">
              <tr><td style="padding:22px 28px;">
                <div style="font-family:'Playfair Display',Georgia,serif;font-size:20px;font-weight:600;color:#FFFFFF;line-height:1.1;">
                  DPR Analyzer Pro
                </div>
                <div style="font-family:Outfit,Arial,sans-serif;font-size:11px;color:#CBD5E1;letter-spacing:0.06em;margin-top:4px;">
                  AURIS · AI-ASSISTED DPR COMPLIANCE ANALYSIS
                </div>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:${COLORS.cardBg};border:1px solid ${COLORS.border};border-radius:0 0 14px 14px;padding:32px 28px;">
            <h1 style="margin:0 0 12px 0;font-family:'Playfair Display',Georgia,serif;font-size:24px;font-weight:600;color:${COLORS.text};line-height:1.2;">
              ${escapeHtml(heading || '')}
            </h1>
            ${
              intro
                ? `<p style="margin:0 0 16px 0;font-family:Outfit,Arial,sans-serif;font-size:15px;color:${COLORS.textMuted};line-height:1.55;">
                     ${escapeHtml(intro)}
                   </p>`
                : ''
            }
            <div style="font-family:Outfit,Arial,sans-serif;font-size:14.5px;color:${COLORS.text};line-height:1.6;">
              ${bodyHtml || ''}
            </div>
            ${cta}
            ${foot}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 8px;font-family:Outfit,Arial,sans-serif;font-size:12px;color:${COLORS.textMuted};text-align:center;line-height:1.55;">
            © AURIS · DPR Analyzer Pro<br />
            You received this because of an action on your DPR Analyzer Pro account.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------
// Operator: new DPR submitted
// ---------------------------------------------------------------------
export function operatorNewUploadTemplate({
  profile,
  job,
  fileCount,
  totalSizeBytes,
  appUrl,
}) {
  const subject = `New DPR submitted — ${job.project_name} (${profile.company_name})`;

  const detailsHtml = [
    rowHtml('Company', profile.company_name),
    rowHtml('Contact', profile.contact_name || profile.email),
    rowHtml('Project', job.project_name),
    job.road_stretch ? rowHtml('Road stretch', job.road_stretch) : '',
    rowHtml('Files', `${fileCount} · ${formatBytes(totalSizeBytes)}`),
    job.notes
      ? rowHtml('Note from client', job.notes, true)
      : '',
  ]
    .filter(Boolean)
    .join('');

  const bodyHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0 0 0;">
      ${detailsHtml}
    </table>
  `;

  const ctaUrl = appUrl
    ? `${appUrl.replace(/\/$/, '')}/jobs/${job.id}`
    : null;

  const html = brandedEmailHtml({
    preheader: `${profile.company_name} submitted a DPR — ${job.project_name}`,
    heading: 'New DPR submitted',
    intro: `${profile.company_name} just uploaded a Detailed Project Report for analysis.`,
    bodyHtml,
    ctaLabel: ctaUrl ? 'Open in admin' : null,
    ctaUrl,
  });

  const text = [
    `New DPR submitted by ${profile.company_name}`,
    ``,
    `Contact: ${profile.contact_name || profile.email}`,
    `Project: ${job.project_name}`,
    job.road_stretch ? `Stretch: ${job.road_stretch}` : null,
    `Files: ${fileCount} (${formatBytes(totalSizeBytes)})`,
    job.notes ? `\nNote from client:\n${job.notes}` : null,
    ctaUrl ? `\nOpen in admin: ${ctaUrl}` : null,
  ]
    .filter((l) => l !== null)
    .join('\n');

  return { subject, html, text };
}

// ---------------------------------------------------------------------
// Client: report is ready
// ---------------------------------------------------------------------
export function clientReportReadyTemplate({ profile, job, appUrl }) {
  const subject = `Your DPR Analysis Report is ready — ${job.project_name}`;
  const greeting = profile.contact_name
    ? `Hi ${profile.contact_name},`
    : 'Hello,';

  const summaryBlock = job.operator_summary
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:18px 0 0 0;background:#F8FAFC;border:1px solid ${COLORS.border};border-radius:8px;">
         <tr><td style="padding:14px 18px;font-family:Outfit,Arial,sans-serif;font-size:13.5px;color:${COLORS.text};line-height:1.55;white-space:pre-wrap;">
           <div style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:${COLORS.textMuted};margin-bottom:6px;">
             SUMMARY FROM THE ANALYST
           </div>
           ${escapeHtml(job.operator_summary)}
         </td></tr>
       </table>`
    : '';

  const bodyHtml = `
    <p style="margin:0 0 14px 0;">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 14px 0;">
      Your compliance review for
      <strong>${escapeHtml(job.project_name)}</strong>
      ${
        job.road_stretch
          ? `(<span style="color:${COLORS.textMuted};">${escapeHtml(job.road_stretch)}</span>)`
          : ''
      } is complete. The full report (PDF) and a short audio overview are
      waiting in your DPR Analyzer Pro portal.
    </p>
    ${summaryBlock}
  `;

  const ctaUrl = appUrl
    ? `${appUrl.replace(/\/$/, '')}/jobs/${job.id}`
    : null;

  const html = brandedEmailHtml({
    preheader: `Your DPR Analysis Report for ${job.project_name} is ready.`,
    heading: 'Your DPR Analysis Report is ready',
    intro: null,
    bodyHtml,
    ctaLabel: ctaUrl ? 'View your report' : null,
    ctaUrl,
    footnote:
      'For security, the report and audio are available only inside the portal — not as attachments to this email.',
  });

  const text = [
    `${greeting}`,
    ``,
    `Your compliance review for ${job.project_name}${job.road_stretch ? ` (${job.road_stretch})` : ''} is complete.`,
    `The PDF report and audio overview are available in your DPR Analyzer Pro portal.`,
    ``,
    job.operator_summary ? `Summary from the analyst:\n${job.operator_summary}\n` : null,
    ctaUrl ? `View your report: ${ctaUrl}` : null,
    ``,
    `— AURIS · DPR Analyzer Pro`,
  ]
    .filter((l) => l !== null)
    .join('\n');

  return { subject, html, text };
}

// Detail-row helper for the operator email's table.
function rowHtml(label, value, multiline = false) {
  const valStyle = multiline
    ? 'white-space:pre-wrap;'
    : 'white-space:normal;';
  return `<tr>
    <td style="padding:6px 0;font-family:Outfit,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${COLORS.textMuted};vertical-align:top;width:120px;">
      ${escapeHtml(label)}
    </td>
    <td style="padding:6px 0;font-family:Outfit,Arial,sans-serif;font-size:14px;color:${COLORS.text};${valStyle}">
      ${escapeHtml(value)}
    </td>
  </tr>`;
}
