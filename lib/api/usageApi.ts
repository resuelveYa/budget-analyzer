// lib/api/usageApi.ts
import { apiClient } from './client';
import type { UsageStats, BudgetAnalyzerMetrics, CashFlowMetrics, ApiResponse } from '@/types/usage';

class UsageApi {
  /**
   * Obtener estadísticas para Budget Analyzer
   */
  async getBudgetAnalyzerStats(): Promise<UsageStats<BudgetAnalyzerMetrics>> {
    const response = await apiClient.get<ApiResponse<UsageStats<BudgetAnalyzerMetrics>>>('/usage/stats', {
      params: { service: 'budget-analyzer' }
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Error obteniendo estadísticas');
    }

    return response.data.data;
  }

  /**
   * Obtener estadísticas para Cash Flow
   */
  async getCashFlowStats(): Promise<UsageStats<CashFlowMetrics>> {
    const response = await apiClient.get<ApiResponse<UsageStats<CashFlowMetrics>>>('/usage/stats', {
      params: { service: 'cash-flow' }
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Error obteniendo estadísticas');
    }

    return response.data.data;
  }

  /**
   * Verificar si puede realizar análisis
   */
  async canAnalyze(): Promise<boolean> {
    try {
      const stats = await this.getBudgetAnalyzerStats();
      const daily = stats.metrics.daily_analyses;
      const monthly = stats.metrics.monthly_analyses;
      
      // Si cualquiera es ilimitado, puede analizar
      if (daily.limit === 'unlimited' || monthly.limit === 'unlimited') return true;
      
      // Debe tener disponible en ambos
      return (daily.current as number) < (daily.limit as number) && 
             (monthly.current as number) < (monthly.limit as number);
    } catch (error) {
      console.error('Error checking analysis permission:', error);
      return false;
    }
  }

  /**
   * Health check del servicio de métricas
   */
  async health() {
    const response = await apiClient.get('/usage/health');
    return response.data;
  }
}

// Exportar instancia única
export const usageApi = new UsageApi();
export default usageApi;