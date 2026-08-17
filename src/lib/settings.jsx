import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getBrand, DEFAULT_BRAND } from '../config/branding.js';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  // Defaults chosen so first paint already shows BRO with billing hidden,
  // even before the /api/settings fetch resolves (no flash of AURIS/credits).
  const [billingEnabled, setBillingEnabled] = useState(false);
  const [brandKey, setBrandKey] = useState(DEFAULT_BRAND);
  const [loaded, setLoaded] = useState(false);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setBillingEnabled(Boolean(data.billingEnabled));
        if (data.activeBrand) setBrandKey(data.activeBrand);
      }
    } catch {
      /* keep safe defaults */
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { refreshSettings(); }, [refreshSettings]);

  const brand = getBrand(brandKey);

  // Apply brand to the static HTML shell (title, favicon, theme-color),
  // since index.html can't read React state.
  useEffect(() => {
    if (brand.docTitle) document.title = brand.docTitle;
    const icon = document.querySelector("link[rel='icon']");
    if (icon && brand.logoIcon) icon.setAttribute('href', brand.logoIcon);
    const tc = document.querySelector("meta[name='theme-color']");
    if (tc && brand.themeColor) tc.setAttribute('content', brand.themeColor);
  }, [brand]);

  const value = { billingEnabled, brand, brandKey, loaded, refreshSettings };
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}
