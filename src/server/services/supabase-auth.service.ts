/**
 * Supabase Auth adapter for BizMate AI.
 * These functions use the project's publishable key; privileged database access is not used.
 */
import { createClient, type Session, type User } from '@supabase/supabase-js';

function getPublicClient() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.SUPABASE_ANON_KEY?.trim();
  if (!url || !key) throw new Error('Supabase Auth is not configured. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}

export interface AuthResult {
  user: Pick<User, 'id' | 'email' | 'created_at' | 'email_confirmed_at'>;
  session: Pick<Session, 'access_token' | 'refresh_token' | 'expires_at' | 'token_type'> | null;
  needsEmailConfirmation: boolean;
}

function normalizeAuthResult(user: User, session: Session | null): AuthResult {
  return {
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      email_confirmed_at: user.email_confirmed_at
    },
    session: session ? {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      token_type: session.token_type
    } : null,
    needsEmailConfirmation: !session
  };
}

export class SupabaseAuthService {
  static async register(params: { email: string; password: string; name: string; businessName?: string; industry?: string }): Promise<AuthResult> {
    const client = getPublicClient();
    const { data, error } = await client.auth.signUp({
      email: params.email.trim().toLowerCase(),
      password: params.password,
      options: { data: {
        full_name: params.name.trim(),
        business_name: params.businessName?.trim() || `${params.name.trim()}'s Brand`,
        industry: params.industry?.trim() || 'Retail'
      } }
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Supabase Auth did not return a user.');
    return normalizeAuthResult(data.user, data.session);
  }

  static async login(email: string, password: string): Promise<AuthResult> {
    const client = getPublicClient();
    const { data, error } = await client.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error || !data.user) throw new Error('Invalid email or password.');
    return normalizeAuthResult(data.user, data.session);
  }

  static async getCurrentUser(accessToken: string) {
    const client = getPublicClient();
    const { data, error } = await client.auth.getUser(accessToken);
    if (error || !data.user) throw new Error('Invalid or expired access token.');
    return data.user;
  }
}
