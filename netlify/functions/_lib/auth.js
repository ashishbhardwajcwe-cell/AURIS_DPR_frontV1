// Server-side identity helpers. Every function that touches user data
// MUST go through requireUser / requireActiveClient — we trust nothing
// in the request body for identity, only the Supabase JWT.

import { getAdminClient } from './supabase.js';
import { httpError } from './response.js';

export async function requireUser(request) {
  const auth = request.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) {
    throw httpError(401, 'Missing or malformed authorization header.');
  }
  const token = auth.slice('Bearer '.length).trim();
  if (!token) throw httpError(401, 'Missing authorization token.');

  const admin = getAdminClient();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) {
    throw httpError(401, 'Invalid or expired session.');
  }
  return data.user;
}

export async function requireProfile(request) {
  const user = await requireUser(request);
  const admin = getAdminClient();
  const { data: profile, error } = await admin
    .from('profiles')
    .select('id, company_name, contact_name, email, role, status')
    .eq('id', user.id)
    .maybeSingle();
  if (error) throw httpError(500, 'Could not load profile.');
  if (!profile) throw httpError(403, 'Profile not found.');
  return { user, profile, admin };
}

export async function requireActiveClient(request) {
  const ctx = await requireProfile(request);
  if (ctx.profile.status === 'pending') {
    throw httpError(403, 'Your account is pending approval.');
  }
  if (ctx.profile.status === 'suspended') {
    throw httpError(403, 'Your account is suspended. Please contact support.');
  }
  if (ctx.profile.status !== 'active') {
    throw httpError(403, 'Your account is not active.');
  }
  return ctx;
}

export async function requireAdmin(request) {
  const ctx = await requireProfile(request);
  if (ctx.profile.role !== 'admin') {
    throw httpError(403, 'Admin privileges required.');
  }
  return ctx;
}
