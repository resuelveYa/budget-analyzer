// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

let supabaseInstance: any = null;

export function createClient() {
  if (typeof window === 'undefined') {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: {
          domain: '.resuelveya.cl',
          path: '/',
          sameSite: 'lax',
          secure: true,
        }
      }
    )
  }

  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: {
          domain: '.resuelveya.cl',
          path: '/',
          sameSite: 'lax',
          secure: true,
        }
      }
    )
  }

  return supabaseInstance
}

export const supabase = createClient();

export async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}
