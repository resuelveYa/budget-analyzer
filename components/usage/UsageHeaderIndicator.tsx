// components/usage/UsageHeaderIndicator.tsx
'use client';

import { useUsageStats } from '@/lib/hooks/useUsageStats';
import { TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UsageWidget } from './UsageWidget';

export function UsageHeaderIndicator() {
  const { stats, loading, canAnalyze } = useUsageStats();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 border border-gray-200">
        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
        <span className="text-sm text-gray-600">Cargando...</span>
      </div>
    );
  }

  if (!stats) return null;

  const dailyPercentage = stats.metrics.daily_analyses.percentage;
  const monthlyPercentage = stats.metrics.monthly_analyses.percentage;
  const maxPercentage = Math.max(dailyPercentage, monthlyPercentage);
  
  const isCritical = maxPercentage >= 90;
  const isWarning = maxPercentage >= 70;

  const getStatusColor = () => {
    if (isCritical) return 'bg-red-50 border-red-300 text-red-700';
    if (isWarning) return 'bg-yellow-50 border-yellow-300 text-yellow-700';
    return 'bg-green-50 border-green-300 text-green-700';
  };

  const dailyRemaining = stats.metrics.daily_analyses.remaining;
  const monthlyRemaining = stats.metrics.monthly_analyses.remaining;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all hover:scale-105 ${getStatusColor()}`}
        >
          {isCritical || isWarning ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <TrendingUp className="w-4 h-4" />
          )}
          <div className="text-left">
            <div className="text-xs font-semibold">
              {dailyRemaining === 'unlimited' ? '∞' : dailyRemaining} hoy
            </div>
            <div className="text-[10px] opacity-75">
              {monthlyRemaining === 'unlimited' ? '∞' : monthlyRemaining} este mes
            </div>
          </div>
        </button>
      </DialogTrigger>

      <DialogContent className="bg-white border-gray-200">
        <DialogHeader>
          <DialogTitle>Estadísticas de Uso</DialogTitle>
        </DialogHeader>
        <UsageWidget />
      </DialogContent>
    </Dialog>
  );
}