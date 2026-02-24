'use client';

import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LogOut, FileText, History, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Logo from '@/components/logo';
import { UsageHeaderIndicator } from '@/components/usage/UsageHeaderIndicator';
import { useState, useEffect, useRef } from 'react';

export function DashboardHeader() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Always show at top
      if (currentScrollY < 10) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      if (currentScrollY < lastScrollY.current) {
        setIsVisible(true);  // scrolling up
      } else if (currentScrollY > lastScrollY.current + 5) { // Threshold to prevent flickering
        setIsVisible(false); // scrolling down
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('https://resuelveya.cl');
  };

  return (
    <header className={`bg-white border-b sticky top-0 z-[100] transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full border-none'}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center space-x-6">
            <Logo size="sm" showText href="/" />

            <nav className="hidden md:flex space-x-5">
              <Link
                href="/analyze"
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition text-sm font-medium"
              >
                <FileText className="w-4 h-4" />
                <span>Analizar</span>
              </Link>
              <Link
                href="/history"
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition text-sm font-medium"
              >
                <History className="w-4 h-4" />
                <span>Historial</span>
              </Link>
              <Link
                href="/stats"
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition text-sm font-medium"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Estadísticas</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            <div className="scale-90 origin-right">
              <UsageHeaderIndicator />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-gray-500 hover:text-red-600 space-x-2 h-8 text-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
