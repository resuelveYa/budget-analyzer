// components/usage/UsageBadge.tsx
'use client';

import { useUsageStats } from '@/lib/hooks/useUsageStats';
import { AlertCircle } from 'lucide-react';

interface UsageBadgeProps {
  metric: 'daily_analyses' | 'monthly_analyses';
}

export function UsageBadge({ metric }: UsageBadgeProps) {
  const { stats, loading } = useUsageStats();

  if (loading || !stats) return null;

  const metricData = stats.metrics[metric];
  const isUnlimited = metricData.limit === 'unlimited';
  
  if (isUnlimited) return null;

  const percentage = metricData.percentage;
  const isWarning = percentage >= 70;
  const isCritical = percentage >= 90;

  if (!isWarning) return null;

  return (
    <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${
      isCritical 
        ? 'bg-red-100 text-red-700' 
        : 'bg-yellow-100 text-yellow-700'
    }`}>
      <AlertCircle className="w-4 h-4" />
      <span>
        {metricData.remaining} {metric === 'daily_analyses' ? 'análisis diarios' : 'análisis mensuales'} restantes
      </span>
    </div>
  );
}