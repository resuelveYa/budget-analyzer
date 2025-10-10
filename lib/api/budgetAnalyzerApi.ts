// lib/budgetAnalyzerApi.ts
import { apiClient } from './client';

/**
 * API específica para Budget Analyzer
 * Maneja todos los endpoints relacionados con análisis de presupuestos
 */

export interface ProjectData {
  type: string;
  location: string;
  area: number;
  estimatedBudget?: number;
  description?: string;
  name?: string;
  startDate?: string;
  client?: string;
}

export interface AnalysisConfig {
  analysisDepth: 'basic' | 'standard' | 'detailed';
  includeMarketData: boolean;
  includeProviders?: boolean;
}

export interface AnalysisHistoryItem {
  id: number;
  analysis_id: string;
  created_at: string;
  analysis_type: 'quick' | 'pdf' | 'project';
  project_type?: string;
  location?: string;
  area_m2?: number;
  estimated_budget?: number;
  confidence_score?: number;
  summary?: string;
  file_name?: string;
}

export interface HistoryResponse {
  success: boolean;
  message: string;
  data: {
    analyses: AnalysisHistoryItem[];
    total: number;
    pagination: {
      limit: number;
      offset: number;
      has_more: boolean;
    };
  };
  timestamp: string;
}

export interface UsageStats {
  user_id: string;
  environment: string;
  current_month: {
    budget_analyses: number;
    pdf_analyses: number;
    comparisons: number;
    total_cost_usd: number;
    total_cost_clp: number;
  };
  limits: {
    monthly_analyses: number;
    pdf_analyses: number;
    max_file_size_mb: number;
    concurrent_analyses: number;
    daily_cost_limit_usd: number;
    global_daily_limit_usd: number;
  };
  usage_percentage: {
    budget_analyses: number;
    pdf_analyses: number;
    daily_cost: number;
  };
}

class BudgetAnalyzerApi {
  /**
   * Análisis rápido de proyecto (sin PDF)
   */
  async analyzeProject(projectData: ProjectData, config: AnalysisConfig) {
    console.log('📊 Enviando análisis rápido:', projectData);
    const response = await apiClient.post('/budget-analysis/quick', {
      ...projectData,
      analysisDepth: config.analysisDepth,
      includeMarketRates: config.includeMarketData,
      includeProviders: config.includeProviders ?? true,
      saveAnalysis: true // ✅ Asegurar que se guarde en BD
    });
    return response.data;
  }

  /**
   * Análisis de PDF
   */
  async analyzePdf(file: File, options?: {
    analysisDepth?: string;
    projectType?: string;
    projectLocation?: string;
    includeProviders?: boolean;
  }) {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options?.analysisDepth) {
      formData.append('analysisDepth', options.analysisDepth);
    }
    if (options?.projectType) {
      formData.append('projectType', options.projectType);
    }
    if (options?.projectLocation) {
      formData.append('projectLocation', options.projectLocation);
    }
    if (options?.includeProviders !== undefined) {
      formData.append('includeProviders', String(options.includeProviders));
    }

    const response = await apiClient.post('/budget-analysis/pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.data || response.data;
  }

  /**
   * Obtener análisis por ID
   */
  async getById(analysisId: string) {
    const response = await apiClient.get(`/budget-analysis/pdf/${analysisId}`);
    return response.data.data;
  }

  /**
   * Obtener historial de análisis del usuario
   */
  async getHistory(limit: number = 20, offset: number = 0): Promise<HistoryResponse> {
    console.log('📚 Solicitando historial, limit:', limit, 'offset:', offset);
    const response = await apiClient.get('/budget-analysis/history', {
      params: { limit, offset },
    });
    console.log('✅ Historial recibido:', response.data);
    return response.data;
  }

  /**
   * Obtener estadísticas de uso
   */
  async getUsageStats(): Promise<UsageStats> {
    const response = await apiClient.get('/budget-analysis/usage/stats');
    return response.data.data;
  }

  /**
   * Health check del servicio
   */
  async healthCheck() {
    const response = await apiClient.get('/budget-analysis/health');
    return response.data;
  }

  /**
   * Validar configuración de análisis
   */
  async validateConfig(config: {
    analysisDepth: string;
    includeMarketData?: boolean;
    includeHistoricalData?: boolean;
  }) {
    const response = await apiClient.post('/budget-analysis/validate-config', config);
    return response.data;
  }

  /**
   * Validar datos de proyecto
   */
  async validateProject(projectData: Partial<ProjectData>) {
    const response = await apiClient.post('/budget-analysis/validate-project', projectData);
    return response.data;
  }

  /**
   * Comparar múltiples análisis PDF
   */
  async comparePdfAnalyses(
    analysisIds: string[],
    comparisonType: 'materials' | 'labor' | 'providers' | 'total_cost' = 'total_cost'
  ) {
    const response = await apiClient.post('/budget-analysis/pdf/compare', {
      analysisIds,
      comparisonType
    });
    return response.data;
  }
}

// Exportar instancia única
export const budgetAnalyzerApi = new BudgetAnalyzerApi();

// Export por defecto para imports más limpios
export default budgetAnalyzerApi;