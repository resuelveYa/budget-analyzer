'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LogOut, FileText, History, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Logo from '@/components/logo';
import { UsageHeaderIndicator } from '@/components/usage/UsageHeaderIndicator';

export function DashboardHeader() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('https://resuelveya.cl');
  };

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Logo size="md" showText href="/" />

            <nav className="hidden md:flex space-x-6">
              <Link
                href="/analyze"
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition"
              >
                <FileText className="w-4 h-4" />
                <span>Analizar</span>
              </Link>
              <Link
                href="/history"
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition"
              >
                <History className="w-4 h-4" />
                <span>Historial</span>
              </Link>
              <Link
                href="/stats"
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Estadísticas</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <UsageHeaderIndicator />

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-gray-600 hover:text-red-600 space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
