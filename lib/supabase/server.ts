// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Detect development mode
const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true' || process.env.NODE_ENV === 'development'

// Cookie config varies between dev and production
const cookieConfig = isDevMode
  ? { path: '/', sameSite: 'lax' as const, secure: false }
  : { domain: '.licitex.cl', path: '/', sameSite: 'lax' as const, secure: true }

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const isBypass = !url || !anonKey || url === 'undefined' || isDevMode

  if (isBypass) {
    const cookieStore = await cookies()
    const token = (await cookieStore).get('sb-local-token')?.value

    const mockUser = { 
      id: 'local-admin-id', 
      email: 'admin@saer.cl',
      user_metadata: { full_name: 'Administrador Local' }
    }

    const mockSession = { 
      access_token: 'local-admin-bypass-token',
      refresh_token: 'local-admin-bypass-refresh-token',
      user: mockUser
    }

    const isAuthenticated = token === 'local-admin-bypass-token'

    return {
      auth: {
        getUser: () => Promise.resolve({ 
          data: { user: isAuthenticated ? mockUser : null }, 
          error: null 
        }),
        getSession: () => Promise.resolve({ 
          data: { session: isAuthenticated ? mockSession : null }, 
          error: null 
        }),
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
