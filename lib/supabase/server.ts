// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Detect development mode
const isProduction = process.env.NODE_ENV === 'production'

const cookieConfig = isProduction
  ? { domain: '.licitex.cl', path: '/', sameSite: 'lax' as const, secure: true }
  : { path: '/', sameSite: 'lax' as const, secure: false }

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const isBypass = process.env.NEXT_PUBLIC_DEV_BYPASS === 'true' || !isProduction || !url || !anonKey || url === 'undefined'

  if (isBypass) {
    const mockUser = {
      id: 'dev-local',
      email: 'dev@licitex.cl',
      user_metadata: { full_name: 'Dev Local' }
    }
    const mockSession = {
      access_token: 'local-admin-bypass-token',
      refresh_token: 'dev-bypass-refresh',
      user: mockUser
    }
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: mockUser }, error: null }),
        getSession: () => Promise.resolve({ data: { session: mockSession }, error: null }),
        signOut: () => Promise.resolve({ error: null }),
      },
      storage: { from: () => ({ upload: () => Promise.resolve({ data: {}, error: null }) }) }
    } as any;
  }

  const cookieStore = await cookies()

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                ...cookieConfig,
              })
            )
          } catch {
            // Server Component context
          }
        },
      },
      cookieOptions: cookieConfig
    }
  )
}
