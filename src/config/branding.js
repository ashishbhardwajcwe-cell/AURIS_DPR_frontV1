// Brand identities. Switch the active one at runtime from Admin → Settings
// (persisted in app_settings.active_brand). Logo files live in /public.
//
// Both brands share the DPR Analyzer Pro product wordmark; the organisation
// (BRO for departmental use, AURIS for commercial use) shows in the eyebrow,
// footer, browser tab, favicon and the sample report's emblem.
export const BRANDS = {
  auris: {
    key: 'auris',
    logo: '/auris-logo.png',                  // gold "A" emblem (fallback only)
    logoIcon: '/auris-logo-icon.png',         // square icon for the browser tab
    wordmark: '/dpr-wordmark-on-dark.png',    // product wordmark for the dark header
    wordmarkLight: '/dpr-wordmark-on-light.png', // navy wordmark for white cards (login/sign-up)
    productName: 'DPR Analyzer Pro',
    tagline: 'AI-Based DPR Compliance Engine',
    orgName: 'AURIS',
    audience: 'Built for consultancy firms working with NHAI, MoRTH, PWD, and BRO.',
    eyebrow: 'AURIS · DPR Analyzer Pro',
    footerText: '© AURIS · DPR Analyzer Pro',
    docTitle: 'DPR Analyzer Pro · AURIS',
    themeColor: '#0E1320',
  },
  bro: {
    key: 'bro',
    logo: '/bro-logo.png',                    // square emblem (fallback only)
    logoIcon: '/bro-logo-icon.png',           // square icon for the browser tab
    wordmark: '/dpr-wordmark-on-dark.png',    // wide cream wordmark for the dark header
    wordmarkLight: '/dpr-wordmark-on-light.png', // navy wordmark for white cards (login/sign-up)
    productName: 'DPR Analyzer Pro',
    tagline: 'AI-Based DPR Compliance Engine',
    orgName: 'Border Roads Organisation',
    audience: 'Built for Border Roads Organisation project teams.',
    eyebrow: 'Border Roads Organisation · DPR Analyzer Pro',
    footerText: '© Border Roads Organisation · DPR Analyzer Pro',
    docTitle: 'DPR Analyzer Pro · BRO',
    themeColor: '#0E1320',
  },
};

// The old placeholder "rs" brand was replaced by AURIS. A database still
// holding "rs" shows AURIS rather than silently falling back to BRO.
const LEGACY_KEYS = { rs: 'auris' };

export const DEFAULT_BRAND = 'bro';
export const BRAND_KEYS = Object.keys(BRANDS);
export function getBrand(key) {
  return BRANDS[LEGACY_KEYS[key] ?? key] || BRANDS[DEFAULT_BRAND];
}
