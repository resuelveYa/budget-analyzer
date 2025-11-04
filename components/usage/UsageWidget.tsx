// components/usage/UsageWidget.tsx
'use client';

import { useUsageStats } from '@/lib/hooks/useUsageStats';
import { TrendingUp, AlertCircle, CheckCircle, Calendar, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function UsageWidget() {
  const { stats, loading, error } = useUsageStats();

  if (loading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error || 'Error cargando datos de uso'}</AlertDescription>
      </Alert>
    );
  }

  const getMetricColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Tu Uso Actual</h3>
          <p className="text-sm text-gray-500">
            Plan: <span className="font-semibold capitalize">{stats.tier}</span>
          </p>
        </div>
        <TrendingUp className="w-6 h-6 text-blue-600" />
      </div>

      {/* Metrics */}
      <div className="space-y-6">
        {/* Daily Analyses */}
        {(() => {
          const metric = stats.metrics.daily_analyses;
          const isUnlimited = metric.limit === 'unlimited';
          const percentage = isUnlimited ? 0 : metric.percentage;

          return (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Análisis Diarios
                  </span>
                </div>
                {isUnlimited ? (
                  <span className="flex items-center space-x-1 text-sm font-bold text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Ilimitado</span>
                  </span>
                ) : (
                  <span className={`text-sm font-bold ${getMetricColor(percentage)}`}>
                    {metric.current} / {metric.limit}
                  </span>
                )}
              </div>

              {!isUnlimited && (
                <>
                  <Progress 
                    value={Math.min(percentage, 100)} 
                    className="h-2"
                  />
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{metric.remaining} restantes</span>
                    <span>{percentage}% usado</span>
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* Monthly Analyses */}
        {(() => {
          const metric = stats.metrics.monthly_analyses;
          const isUnlimited = metric.limit === 'unlimited';
          const percentage = isUnlimited ? 0 : metric.percentage;

          return (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Análisis Mensuales
                  </span>
                </div>
                {isUnlimited ? (
                  <span className="flex items-center space-x-1 text-sm font-bold text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Ilimitado</span>
                  </span>
                ) : (
                  <span className={`text-sm font-bold ${getMetricColor(percentage)}`}>
                    {metric.current} / {metric.limit}
                  </span>
                )}
              </div>

              {!isUnlimited && (
                <>
                  <Progress 
                    value={Math.min(percentage, 100)} 
                    className="h-2"
                  />
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{metric.remaining} restantes</span>
                    <span>{percentage}% usado</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Se resetea mensualmente
                  </p>
                </>
              )}
            </div>
          );
        })()}
      </div>

      {/* Upgrade CTA */}
      {stats.tier === 'free' && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <a
            href="https://resuelveya.cl#precios"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            Actualizar Plan
          </a>
        </div>
      )}
    </Card>
  );
}