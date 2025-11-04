// app/(dashboard)/layout.tsx
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { FileText, History, BarChart3 } from 'lucide-react';
import Logo from '@/components/logo';
import { UsageHeaderIndicator } from '@/components/usage/UsageHeaderIndicator'; // ← AGREGAR

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
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
            
            {/* ← AGREGAR INDICADOR DE USO AQUÍ */}
            <div className="flex items-center space-x-4">
              <UsageHeaderIndicator />
              
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10"
                  }
                }}
              />
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}