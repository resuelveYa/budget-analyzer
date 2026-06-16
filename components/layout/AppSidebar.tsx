'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from './SidebarContext';
import { 
  LayoutDashboard, 
  FileText, 
  History, 
  BarChart3, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Logo from '@/components/logo';

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
};

export function AppSidebar() {
  const pathname = usePathname();
  const { 
    isExpanded, 
    isHovered, 
    isMobileOpen, 
    setIsHovered,
    toggleSidebar 
  } = useSidebar();

  const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://licitex.cl';

  const navItems: NavItem[] = [
    {
      name: 'Inicio',
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
      path: '/'
    },
    {
      name: 'Analizar',
      icon: <FileText className="w-5 h-5 shrink-0" />,
      path: '/analyze'
    },
    {
      name: 'Historial',
      icon: <History className="w-5 h-5 shrink-0" />,
      path: '/history'
    },
    {
      name: 'Estadísticas',
      icon: <BarChart3 className="w-5 h-5 shrink-0" />,
      path: '/stats'
    }
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  const showFullSidebar = isExpanded || isHovered || isMobileOpen;

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-200 flex flex-col justify-between transition-all duration-300 ease-in-out z-50
        ${showFullSidebar ? 'w-[200px]' : 'w-[60px]'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col grow">
        {/* Top Section / Logo */}
        <div className={`h-14 border-b border-gray-200 flex items-center px-3 ${showFullSidebar ? 'justify-start' : 'justify-center'}`}>
          <div className="overflow-hidden flex items-center">
            <Logo size="sm" showText={showFullSidebar} href="/" />
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group relative
                  ${active 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950'
                  }
                `}
              >
                <span className={active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-700'}>
                  {item.icon}
                </span>
                
                {showFullSidebar ? (
                  <span className="truncate opacity-100 transition-opacity duration-200">
                    {item.name}
                  </span>
                ) : (
                  <span className="absolute left-14 bg-gray-900 text-white text-xs rounded-md py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section - Return to Licitex & Toggle Button if Collapsed */}
      <div className="p-3 border-t border-gray-200 space-y-1">
        <a
          href={landingUrl}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-950 transition-all group relative`}
        >
          <span className="text-gray-400 group-hover:text-gray-700">
            <ArrowLeft className="w-5 h-5 shrink-0" />
          </span>
          {showFullSidebar ? (
            <span className="truncate">Volver a Licitex</span>
          ) : (
            <span className="absolute left-14 bg-gray-900 text-white text-xs rounded-md py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              Volver a Licitex
            </span>
          )}
        </a>

      </div>
    </aside>
  );
}
