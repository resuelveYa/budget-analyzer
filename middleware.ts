import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Detect production based on hostname - more reliable than env vars
  const hostname = request.headers.get('host') || ''
  const isProduction = hostname.endsWith('resuelveya.cl')

  // Cookie config varies between dev and production
  const cookieConfig = isProduction
    ? { domain: '.resuelveya.cl', path: '/', sameSite: 'lax' as const, secure: true }
    : { path: '/', sameSite: 'lax' as const, secure: false }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            if (isProduction) {
              // En producción: eliminar cookie del subdominio si existiera
              supabaseResponse.cookies.set(name, '', {
                ...options,
                domain: 'budget.resuelveya.cl',
                maxAge: 0,
              })
            }
            // Setear la cookie (con o sin dominio según entorno)
            supabaseResponse.cookies.set(name, value, {
              ...options,
              ...cookieConfig,
            })
          })
        },
      },
      cookieOptions: cookieConfig
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Budget analyzer is typically protected
  // If no user, redirect to landing's sign-in
  if (!user && !request.nextUrl.pathname.startsWith('/api/public')) {
    // Check if it's a fetch/RSC request to avoid CORS issues with redirects
    const isFetch = request.headers.get('accept')?.includes('text/x-component') ||
      request.headers.get('accept')?.includes('application/json') ||
      request.headers.get('next-router-prefetch')

    if (isFetch) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      )
    }

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://resuelveya.cl'
    const loginUrl = new URL('/sign-in', landingUrl)
    loginUrl.searchParams.set('redirect_url', request.url)
    const response = NextResponse.redirect(loginUrl)
    // Pass existing cookies to avoid losing session during redirect
    supabaseResponse.cookies.getAll().forEach(cookie => {
      response.cookies.set(cookie.name, cookie.value, {
        ...cookieConfig,
      })
    })
    return response
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
