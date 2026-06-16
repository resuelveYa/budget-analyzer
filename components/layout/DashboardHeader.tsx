'use client';

import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';
import { UsageHeaderIndicator } from '@/components/usage/UsageHeaderIndicator';
import { useState, useEffect, useRef } from 'react';
import { useSidebar } from './SidebarContext';

export function DashboardHeader() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

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
    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://licitex.cl';
    router.push(landingUrl);
  };

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  return (
    <header className={`bg-white border-b sticky top-0 z-40 transition-transform duration-300 h-14 flex items-center ${isVisible ? 'translate-y-0' : '-translate-y-full border-none'}`}>
      <div className="w-full px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center space-x-4">
            {/* Hamburger Toggle Button */}
            <button
              onClick={handleToggle}
              className="flex items-center justify-center w-9 h-9 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition focus:outline-none"
              aria-label="Toggle Sidebar"
            >
              {isMobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            {/* Logo - only visible on mobile/tablet */}
            <div className="lg:hidden">
              <Logo size="sm" showText={true} href="/" />
            </div>
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
