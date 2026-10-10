/**
 * Server-only Supabase client factories.
 *
 * User-scoped client: forwards a verified Supabase Auth access token so database
 * requests are evaluated using the caller's JWT and RLS policies.
 *
 * Admin client: bypasses RLS. Use only inside trusted server code after verifying
 * the caller and authorizing the requested operation. Never import into browser code.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function projectUrl(): string {
  const value = requiredEnv('SUPABASE_URL');
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(value)) {
    throw new Error('SUPABASE_URL must be a valid Supabase HTTPS project URL.');
  }
  return value;
}

function publicKey(): string {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim()
    || process.env.SUPABASE_ANON_KEY?.trim();
  if (!key) throw new Error('Set SUPABASE_PUBLISHABLE_KEY in the server environment.');
  return key;
}

/** Create a client scoped to a verified user's Supabase Auth access token. */
export function createSupabaseUserClient(accessToken: string): SupabaseClient {
  if (!accessToken || accessToken.trim().length < 20) {
    throw new Error('A verified Supabase Auth access token is required.');
  }

  return createClient(projectUrl(), publicKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  });
}

/**
 * Create a privileged server-side client. This client bypasses RLS.
 * Do not use for ordinary user CRUD or expose it to the frontend.
 */
export function createSupabaseAdminClient(): SupabaseClient {
  const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (typeof window !== 'undefined') {
    throw new Error('The Supabase admin client must never run in a browser.');
  }

  return createClient(projectUrl(), serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}
