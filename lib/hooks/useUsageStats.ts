// lib/hooks/useUsageStats.ts
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { usageApi } from '@/lib/api/usageApi';
import type { UsageStats, BudgetAnalyzerMetrics } from '@/types/usage';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

import { useAuth } from '@/components/auth/AuthContext';

export function useUsageStats() {
  const { user, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<UsageStats<BudgetAnalyzerMetrics> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await usageApi.getBudgetAnalyzerStats();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching usage stats:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchStats();
      // Refrescar cada 30 segundos
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  return {
    stats,
    loading: loading || authLoading,
    error,
    refetch: fetchStats,
    // Helpers
    canAnalyze: stats ? (
      (stats.metrics.daily_analyses.limit === 'unlimited' ||
        stats.metrics.daily_analyses.remaining !== 0) &&
      (stats.metrics.monthly_analyses.limit === 'unlimited' ||
        stats.metrics.monthly_analyses.remaining !== 0)
    ) : false
  };
}