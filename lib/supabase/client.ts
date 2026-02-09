// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

// Detect if we are on a resuelveya.cl domain (including subdomains)
const isProduction = typeof window !== 'undefined'
  ? window.location.hostname.endsWith('resuelveya.cl')
  : process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_DEV_MODE

// Cookie config varies between dev and production
const cookieConfig = isProduction
  ? { domain: '.resuelveya.cl', path: '/', sameSite: 'lax' as const, secure: true }
  : { path: '/', sameSite: 'lax' as const, secure: false }

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
