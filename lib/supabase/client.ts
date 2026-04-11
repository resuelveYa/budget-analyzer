// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

// Detect if we are on a licitex.cl domain (including subdomains)
const isProduction = typeof window !== 'undefined'
  ? window.location.hostname.endsWith('licitex.cl')
  : process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_DEV_MODE

// Cookie config varies between dev and production
const cookieConfig = isProduction
  ? { domain: '.licitex.cl', path: '/', sameSite: 'lax' as const, secure: true }
  : { path: '/', sameSite: 'lax' as const, secure: false }

let supabaseInstance: any = null;

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isBypass = !url || !anonKey || url === 'undefined' || !isProduction;

  if (isBypass) {
    // Helper to get cookie
    const getLocalToken = () => {
      if (typeof document === 'undefined') return null;
      return document.cookie.split('; ').find(row => row.startsWith('sb-local-token='))?.split('=')[1];
    };

    // Helper to set cookie
    const setLocalToken = (token: string | null) => {
      if (typeof document === 'undefined') return;
      if (token) {
        document.cookie = `sb-local-token=${token}; path=/; max-age=604800; SameSite=Lax`;
      } else {
        document.cookie = `sb-local-token=; path=/; max-age=0; SameSite=Lax`;
      }
    };

    const mockUser = { 
      id: 'local-admin-id', 
      email: 'admin@saer.cl',
      user_metadata: { full_name: 'Administrador Local' }
    };

    const mockSession = { 
      access_token: 'local-admin-bypass-token',
      refresh_token: 'local-admin-bypass-refresh-token',
      user: mockUser
    };

    return {
      auth: {
        getSession: () => {
          const token = getLocalToken();
          if (token === 'local-admin-bypass-token') {
            return Promise.resolve({ data: { session: mockSession }, error: null });
          }
          return Promise.resolve({ data: { session: null }, error: null });
        },
        getUser: () => {
          const token = getLocalToken();
          if (token === 'local-admin-bypass-token') {
            return Promise.resolve({ data: { user: mockUser }, error: null });
          }
          return Promise.resolve({ data: { user: null }, error: null });
        },
        signInWithPassword: ({ email }: { email: string }) => {
          if (email === 'admin@saer.cl') {
            setLocalToken('local-admin-bypass-token');
            return Promise.resolve({ data: { user: mockUser, session: mockSession }, error: null });
          }
          return Promise.resolve({ data: { user: null, session: null }, error: null });
        },
        signInWithOAuth: () => Promise.resolve({ data: {}, error: null }),
        setSession: (session: any) => {
          if (session?.access_token === 'local-admin-bypass-token') {
            setLocalToken('local-admin-bypass-token');
          }
          return Promise.resolve({ data: { user: mockUser, session: mockSession }, error: null });
        },
        onAuthStateChange: (callback: any) => {
          // Trigger once
          const token = getLocalToken();
          if (token === 'local-admin-bypass-token') {
            callback('SIGNED_IN', mockSession);
          }
          return { data: { subscription: { unsubscribe: () => { } } } };
        },
        signOut: () => {
          setLocalToken(null);
          return Promise.resolve({ error: null });
        },
      },
      storage: { from: () => ({ upload: () => Promise.resolve({ data: {}, error: null }) }) }
    } as any;
  }

  if (typeof window === 'undefined') {
    return createBrowserClient(url, anonKey, { cookieOptions: cookieConfig });
  }

  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(url, anonKey, { cookieOptions: cookieConfig });
  }

  return supabaseInstance;
}

export const supabase = createClient();

export async function getAccessToken() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || url === 'undefined') {
    return 'local-admin-bypass-token';
  }
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}
