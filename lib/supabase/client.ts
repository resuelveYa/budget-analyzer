// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

// Detect development mode
const isDevMode = typeof window !== 'undefined'
  ? window.location.hostname === 'localhost'
  : process.env.NEXT_PUBLIC_DEV_MODE === 'true' || process.env.NODE_ENV === 'development'

// Cookie config varies between dev and production
const cookieConfig = isDevMode
  ? { path: '/', sameSite: 'lax' as const, secure: false }
  : { domain: '.resuelveya.cl', path: '/', sameSite: 'lax' as const, secure: true }

let supabaseInstance: any = null;

export function createClient() {
  if (typeof window === 'undefined') {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookieOptions: cookieConfig }
    )
  }

  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookieOptions: cookieConfig }
    )
  }

  return supabaseInstance
}

export const supabase = createClient();

export async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}
