// lib/hooks/useUsageStats.ts
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { usageApi } from '@/lib/api/usageApi';
import type { UsageStats, BudgetAnalyzerMetrics } from '@/types/usage';

export function useUsageStats() {
  const { isSignedIn } = useAuth();
  const [stats, setStats] = useState<UsageStats<BudgetAnalyzerMetrics> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!isSignedIn) {
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
    fetchStats();
    
    // Refrescar cada 30 segundos
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [isSignedIn]);

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