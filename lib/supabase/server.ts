// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Detect development mode
const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true' || process.env.NODE_ENV === 'development'

// Cookie config varies between dev and production
const cookieConfig = isDevMode
  ? { path: '/', sameSite: 'lax' as const, secure: false }
  : { domain: '.resuelveya.cl', path: '/', sameSite: 'lax' as const, secure: true }

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
