'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * /auth/callback
 *
 * Esta página recibe el token-handoff desde otra app (por ejemplo, landing).
 * En desarrollo local los puertos no comparten cookies, así que landing
 * pasa los tokens en el hash de la URL:
 *   /auth/callback?next=/dashboard#access_token=X&refresh_token=Y&type=recovery
 *
 * Aquí leemos esos tokens del hash y llamamos supabase.auth.setSession()
 * para establecer la sesión en este origen (:3002).
 */
export default function AuthCallbackPage() {
  const router = useRouter()
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    const handleCallback = async () => {
      const hash = window.location.hash
      const searchParams = new URLSearchParams(window.location.search)
      const next = searchParams.get('next') || '/dashboard'

      if (hash) {
        // Parse hash tokens (format: #access_token=X&refresh_token=Y&type=recovery)
        const hashParams = new URLSearchParams(hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (accessToken && refreshToken) {
          try {
            const supabase = createClient()
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
            if (error) {
              console.error('[auth/callback] Error setting session:', error.message)
              // Redirigir al login de landing con el redirect_url original
              const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://resuelveya.cl'
              window.location.href = `${landingUrl}/sign-in?redirect_url=${encodeURIComponent(window.location.origin + next)}`
              return
            }
            console.log('[auth/callback] Session established successfully')
            router.replace(next)
            return
          } catch (err) {
            console.error('[auth/callback] Unexpected error:', err)
          }
        }
      }

      // Sin tokens en el hash → redirigir al login
      const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://resuelveya.cl'
      window.location.href = `${landingUrl}/sign-in?redirect_url=${encodeURIComponent(window.location.origin + next)}`
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Iniciando sesión...</p>
      </div>
    </div>
  )
}
