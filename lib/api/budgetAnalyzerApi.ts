// lib/budgetAnalyzerApi.ts
import { apiClient } from './client';
import usageApi from './usageApi';

// ✅ IMPORTS SIMPLES - Sin re-exports
import type { ProjectData } from '@/types/budgetAnalysis';
import type { AnalysisConfig } from '@/types/budgetAnalysis';
import type { AnalysisHistoryItem } from '@/types/budgetAnalysis';
import type { HistoryResponse } from '@/types/budgetAnalysis';
import type { PdfAnalysisConfig } from '@/types/budgetAnalysis';
import type { PdfAnalysisResult } from '@/types/budgetAnalysis';

/**
 * API específica para Budget Analyzer
 * ✅ ÚNICA FUENTE DE VERDAD para análisis de presupuestos
 */
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
      includeProviders: config.includeProviders ?? true, // ✅ Ahora funciona
      saveAnalysis: true
    }, {
      timeout: 180000, // 3 minutos
    });
    return response.data;
  }

  /**
   * Análisis de PDF
   */
  async analyzePdf(
    fileOrFormData: File | FormData,
    options?: PdfAnalysisConfig
  ): Promise<any> {
    let formData: FormData;

    // Si ya es FormData, usarlo directamente
    if (fileOrFormData instanceof FormData) {
      formData = fileOrFormData;
    } else {
      // Si es File, crear FormData
      formData = new FormData();
      formData.append('file', fileOrFormData);

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
    }

    const response = await apiClient.post('/budget-analysis/pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minutos para PDFs
    });

    return response.data.data || response.data;
  }

  /**
   * Análisis de proyecto con múltiples PDFs
   * @param files - Array de archivos PDF
   * @param config - Configuración: projectType, analysisDepth
   */
  async analyzePdfProject(
    files: File[],
    config?: PdfAnalysisConfig
  ): Promise<any> {
    const formData = new FormData();

    files.forEach(file => {
      formData.append('files', file);
    });

    // Project type for intelligent analysis
    if (config?.projectType) {
      formData.append('projectType', config.projectType);
    }

    if (config?.analysisDepth) {
      formData.append('analysisDepth', config.analysisDepth);
    }

    // Add XLSX AI mapping data to pass it down to the API
    // TypeScript will complain if it's not defined in PdfAnalysisConfig, 
    // but we can safely access it as (config as any).xlsxMapping
    const xlsxMapping = (config as any)?.xlsxMapping;
    if (xlsxMapping) {
      formData.append('xlsx_mapping', JSON.stringify(xlsxMapping));
    }

    const response = await apiClient.post('/budget-analysis/project', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 1800000, // 30 minutos para proyectos complejos (Multi-Pass Deep Analysis)
    });

    return response.data;
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
   * ✅ MÉTODO PRINCIPAL para history page
   */
  async getHistory(limit: number = 20, offset: number = 0): Promise<HistoryResponse> {
    const response = await apiClient.get('/budget-analysis/history', {
      params: { limit, offset },
    });
    console.log('✅ Historial recibido:', response.data);
    return response.data;
  }

  /**
   * Obtener estadísticas de uso
   * @deprecated Usar usageApi.getBudgetAnalyzerStats()
   */
  async getUsageStats() {
    console.warn('⚠️ budgetAnalyzerApi.getUsageStats() está deprecado. Usar usageApi.getBudgetAnalyzerStats()');
    return usageApi.getBudgetAnalyzerStats();
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

  /**
   * Exportar análisis (PDF o Excel)
   */
  async exportAnalysis(analysis: any, options: { margin?: number } = {}, format: 'pdf' | 'excel' | 'xlsx' = 'pdf') {
    const response = await apiClient.post('/budget-analysis/export', {
      analysis,
      options,
      format
    }, {
      responseType: 'blob'
    });
    return response.data;
  }

  /**
   * @deprecated Usar exportAnalysis
   */
  async exportToPdf(analysis: any, options: { margin?: number } = {}) {
    return this.exportAnalysis(analysis, options, 'pdf');
  }
}

// ✅ Exportar instancia única
export const budgetAnalyzerApi = new BudgetAnalyzerApi();

// ✅ Export por defecto
export default budgetAnalyzerApi;