'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const isLocal = process.env.NEXT_PUBLIC_DEV_BYPASS === 'true' || 
                    (typeof window !== 'undefined' && 
                      (window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' || 
                       window.location.hostname.startsWith('192.168.')));
    
    if (isLocal) {
      const mockUser = {
        id: 'dev-local',
        email: 'dev@licitex.cl',
        user_metadata: { full_name: 'Dev Local' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      } as any;
      setUser(mockUser);
      setSession({ user: mockUser, access_token: 'local-admin-bypass-token' } as any);
      setIsLoading(false);
      return;
    }

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        if (event === 'SIGNED_OUT') {
          const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://licitex.cl'
          window.location.href = `${landingUrl}/sign-in?redirect_url=${encodeURIComponent(window.location.href)}`
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
