'use client';
// app/(dashboard)/layout.tsx
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { useState, useEffect } from 'react';
import CompanyProfileForm from '@/components/CompanyProfileForm';
import { budgetAnalyzerApi } from '@/lib/api/budgetAnalyzerApi';
import type { CompanyProfile } from '@/lib/api/budgetAnalyzerApi';

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
  }, []);

  const handleProfileSaved = (profile: CompanyProfile) => {
    setShowProfileForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      {/* Company profile gate — shown as overlay until completed */}
      {showProfileForm && (
        <CompanyProfileForm
          onSaved={handleProfileSaved}
          dismissible={true}
          onDismiss={() => setShowProfileForm(false)}
        />
      )}

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}