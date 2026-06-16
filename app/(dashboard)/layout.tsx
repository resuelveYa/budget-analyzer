'use client';

import { useState, useEffect } from 'react';
import { SidebarProvider, useSidebar } from '@/components/layout/SidebarContext';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import CompanyProfileForm from '@/components/CompanyProfileForm';
import { budgetAnalyzerApi } from '@/lib/api/budgetAnalyzerApi';
import type { CompanyProfile } from '@/lib/api/budgetAnalyzerApi';

function DashboardLayoutContent({
  children,
  showProfileForm,
  setShowProfileForm,
  handleProfileSaved
}: {
  children: React.ReactNode;
  showProfileForm: boolean;
  setShowProfileForm: (show: boolean) => void;
  handleProfileSaved: (profile: CompanyProfile) => void;
}) {
  const { isExpanded, isHovered, isMobileOpen, setIsMobileOpen } = useSidebar();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <AppSidebar />

      {/* Main Layout Container */}
      <div 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out
          ${isExpanded || isHovered ? 'lg:pl-[200px]' : 'lg:pl-[60px]'}
        `}
      >
        <DashboardHeader />

        {/* Company profile gate — shown as overlay until completed */}
        {showProfileForm && (
          <CompanyProfileForm
            onSaved={handleProfileSaved}
            dismissible={true}
            onDismiss={() => setShowProfileForm(false)}
          />
        )}

        <main className="flex-1 container mx-auto px-4 py-8">
          {children}
        </main>
      </div>

      {/* Backdrop overlay for mobile viewport */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    // Check if company profile exists — show form if not
    budgetAnalyzerApi.getCompanyProfile()
      .then(profile => {
        if (!profile || !profile.fortalezas) {
          setShowProfileForm(true);
        }
      })
      .catch(() => {
        // Network error or not authenticated — don't block
      })
      .finally(() => setProfileLoaded(true));

    const handleOpen = () => setShowProfileForm(true);
    window.addEventListener('open-profile-form', handleOpen);
    return () => window.removeEventListener('open-profile-form', handleOpen);
  }, []);

  const handleProfileSaved = (profile: CompanyProfile) => {
    setShowProfileForm(false);
  };

  return (
    <SidebarProvider>
      <DashboardLayoutContent
        showProfileForm={showProfileForm}
        setShowProfileForm={setShowProfileForm}
        handleProfileSaved={handleProfileSaved}
      >
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}