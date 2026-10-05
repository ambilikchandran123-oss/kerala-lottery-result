import { createClient } from '@supabase/supabase-js';

// Polyfill WebSocket constructor for Node.js < 22 environments where native WebSocket is absent
if (typeof (globalThis as any).WebSocket === 'undefined') {
  (globalThis as any).WebSocket = class MockWebSocket {};
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  !supabaseUrl.includes('your-supabase-project') &&
  (supabaseAnonKey || supabaseServiceRoleKey) &&
  !supabaseAnonKey.includes('your-supabase-anon-key')
);

// Public client (Respects RLS - anon select only)
export const supabasePublic = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey || supabaseServiceRoleKey, {
      auth: { persistSession: false }
    })
  : null;

// Server-side service client for secure ingestion and admin verification (bypasses RLS)
export const supabaseAdmin = (isSupabaseConfigured && supabaseServiceRoleKey)
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false }
    })
  : null;
