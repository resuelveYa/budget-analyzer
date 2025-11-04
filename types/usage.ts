// lib/types/usage.ts

export interface UsageMetric {
  current: number;
  limit: number | 'unlimited';
  remaining: number | 'unlimited';
  percentage: number;
  reset_type: 'daily' | 'monthly' | 'never';
  next_reset: string | null;
}

export interface BudgetAnalyzerMetrics {
  daily_analyses: UsageMetric;
  monthly_analyses: UsageMetric;
}

export interface CashFlowMetrics {
  transactions: UsageMetric;
  organizations: UsageMetric;
  export_reports: UsageMetric;
  advanced_projections: UsageMetric;
}

export interface UsageStats<T = BudgetAnalyzerMetrics | CashFlowMetrics> {
  service: 'budget-analyzer' | 'cash-flow';
  tier: 'free' | 'pro' | 'starter' | 'professional' | 'enterprise';
  features: string[];
  restrictions?: Record<string, any>;
  metrics: T;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: string;
}