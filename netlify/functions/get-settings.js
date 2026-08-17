import { getSettings } from './_lib/settings.js';
import { json, errorResponse } from './_lib/response.js';

export default async () => {
  try {
    const s = await getSettings();
    // Only expose the whitelisted public fields.
    return json({ billingEnabled: s.billingEnabled, activeBrand: s.activeBrand });
  } catch (err) {
    return errorResponse(err);
  }
};

export const config = { path: '/api/settings' };
