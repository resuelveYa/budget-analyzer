// lib/hooks/useUsageStats.ts
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { usageApi } from '@/lib/api/usageApi';
import type { UsageStats, BudgetAnalyzerMetrics } from '@/types/usage';

export function useUsageStats() {
  const [user, setUser] = useState<any>(null);
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
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchStats();
      // Refrescar cada 30 segundos
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  return {
    stats,
    loading,
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