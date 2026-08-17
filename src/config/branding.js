// Brand identities. Switch the active one at runtime from Admin → Settings
// (persisted in app_settings.active_brand). Logo files live in /public.
export const BRANDS = {
  auris: {
    key: 'auris',
    logo: '/auris-logo.png',
    logoIcon: '/auris-logo-icon.png',
    productName: 'DPR Analyzer Pro',
    tagline: 'AI-Assisted DPR Compliance Analysis · Road & Highway Projects',
    orgName: 'AURIS',
    eyebrow: 'AURIS · DPR Analyzer Pro',
    footerText: '© AURIS · DPR Analyzer Pro',
    docTitle: 'DPR Analyzer Pro · AURIS',
    themeColor: '#0F3460',
  },
  bro: {
    key: 'bro',
    logo: '/bro-logo.png',                    // square emblem (fallback only)
    logoIcon: '/bro-logo-icon.png',           // square icon for the browser tab
    wordmark: '/dpr-wordmark-on-dark.png',    // wide cream wordmark for the dark header
    productName: 'DPR Analyzer Pro',
    tagline: 'AI-Based DPR Compliance Engine',
    orgName: 'Border Roads Organisation',
    eyebrow: 'Border Roads Organisation · DPR Analyzer Pro',
    footerText: '© Border Roads Organisation · DPR Analyzer Pro',
    docTitle: 'DPR Analyzer Pro · BRO',
    themeColor: '#0E1320',
  },
  // Placeholder for the future "RS" brand — fill in strings and add rs-logo.png
  // to /public when ready. Kept here so the admin dropdown already lists it.
  rs: {
    key: 'rs',
    logo: '/rs-logo.png',
    logoIcon: '/rs-logo-icon.png',
    wordmark: '/dpr-wordmark-on-dark.png',    // reuses the product wordmark on the dark header
    productName: 'DPR Analyzer Pro',
    tagline: 'AI-Based DPR Compliance Engine',
    orgName: 'RS',
    eyebrow: 'RS · DPR Analyzer Pro',
    footerText: '© RS · DPR Analyzer Pro',
    docTitle: 'DPR Analyzer Pro · RS',
    themeColor: '#0E1320',
  },
  // NOTE: the `auris` brand has no `wordmark` field on purpose — brands without
  // one fall back to the square logo + text-name layout (see Header step below).
};

export const DEFAULT_BRAND = 'bro';
export const BRAND_KEYS = Object.keys(BRANDS);
export function getBrand(key) {
  return BRANDS[key] || BRANDS[DEFAULT_BRAND];
}
