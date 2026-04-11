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
    const isLocal = 
      !process.env.NEXT_PUBLIC_SUPABASE_URL || 
      process.env.NEXT_PUBLIC_SUPABASE_URL === 'undefined' ||
      (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ||
      process.env.NEXT_PUBLIC_DEV_MODE === 'true';
    
    if (isLocal) {
      console.log('🛡️ AuthContext: Local Bypass Active');
      // Helper to get cookie
      const getLocalToken = () => {
        return document.cookie.split('; ').find(row => row.startsWith('sb-local-token='))?.split('=')[1];
      };

      const token = getLocalToken();
      if (token === 'local-admin-bypass-token') {
        const mockUser = {
          id: 'local-admin-id',
          email: 'admin@saer.cl',
          user_metadata: { full_name: 'Administrador Local' },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        } as any;
        
        setUser(mockUser);
        setSession({ user: mockUser, access_token: 'local-admin-bypass-token' } as any);
      } else {
        setUser(null);
        setSession(null);
      }
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
      (_event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
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
