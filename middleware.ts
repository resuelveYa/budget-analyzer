import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Eliminar cookies huérfanas en el subdominio para evitar conflictos
            supabaseResponse.cookies.set(name, '', { ...options, maxAge: 0, domain: 'budget.resuelveya.cl' });

            // Setear la cookie correcta en el dominio principal
            supabaseResponse.cookies.set(name, value, {
              ...options,
              domain: '.resuelveya.cl',
              path: '/',
            });
          });
        },
      },
      cookieOptions: {
        domain: '.resuelveya.cl',
        path: '/',
        sameSite: 'lax',
        secure: true,
      }
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
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
