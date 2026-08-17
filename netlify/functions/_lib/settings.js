import { getAdminClient } from './supabase.js';

// Reads app_settings and returns typed values with safe defaults.
// Defaults = departmental mode: billing off, BRO brand.
export async function getSettings() {
  try {
    const admin = getAdminClient();
    const { data, error } = await admin.from('app_settings').select('key, value');
    if (error || !Array.isArray(data)) return { billingEnabled: false, activeBrand: 'bro' };
    const map = {};
    for (const row of data) map[row.key] = row.value;
    return {
      billingEnabled: map.billing_enabled === true,
      activeBrand: typeof map.active_brand === 'string' ? map.active_brand : 'bro',
    };
  } catch {
    return { billingEnabled: false, activeBrand: 'bro' };
  }
}
