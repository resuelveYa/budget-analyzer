// lib/api/client.ts - VERSIÓN OPTIMIZADA
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

// ==========================================
// TIPOS E INTERFACES
// ==========================================

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

// ==========================================
// CLIENTE API
// ==========================================

class ApiClient {
  private client: AxiosInstance;
  private getTokenFunction: (() => Promise<string | null>) | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 
        (process.env.NODE_ENV === 'development' 
          ? '/api/backend' 
          : 'https://api.resuelveya.cl/api'),
      timeout: 180000, // ✅ 3 minutos para análisis con IA
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
      // ✅ Configuración adicional para requests largos
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    // Interceptor de request - agrega token automáticamente
    this.client.interceptors.request.use(
      async (config) => {
        if (this.getTokenFunction) {
          const token = await this.getTokenFunction();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('✅ Token agregado al request');
          }
        }
        console.log('📤 Request:', config.method?.toUpperCase(), config.url);
        return config;
      },
      (error) => {
        console.error('❌ Error en request interceptor:', error);
        return Promise.reject(error);
      }
    );

    // Interceptor de response - maneja errores comunes
    this.client.interceptors.response.use(
      (response) => {
        console.log('✅ Response:', response.status, response.config.url);
        return response;
      },
      (error: AxiosError) => {
        console.error('❌ Error Response:', {
          status: error.response?.status,
          url: error.config?.url,
          code: error.code,
          message: error.message
        });

        // ✅ Manejo específico de timeouts
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          console.error('⏱️ Timeout detectado - El análisis está tardando más de lo esperado');
          return Promise.reject({
            ...error,
            message: 'El análisis está tardando más de lo esperado. Por favor, intenta nuevamente.'
          });
        }

        // ✅ Manejo de errores 401
        if (error.response?.status === 401) {
          if (typeof window !== 'undefined') {
            window.location.href = '/sign-in';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  setTokenGetter(getter: () => Promise<string | null>) {
    this.getTokenFunction = getter;
  }

  // ==========================================
  // MÉTODOS GENÉRICOS HTTP
  // ==========================================

  async get<T = any>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.get<T>(url, config);
    return response;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.post<T>(url, data, config);
    return response;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.put<T>(url, data, config);
    return response;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.patch<T>(url, data, config);
    return response;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.delete<T>(url, config);
    return response;
  }

  // ==========================================
  // BUDGET ANALYZER - MÉTODOS ESPECÍFICOS
  // ==========================================

  /**
   * Análisis rápido de proyecto (sin PDF)
   * ✅ Con timeout extendido específico
   */
  async analyzeProject(projectData: ProjectData, config: AnalysisConfig) {
    console.log('📊 Enviando análisis rápido:', projectData);
    const response = await this.client.post('/budget-analysis/quick', {
      ...projectData,
      analysisDepth: config.analysisDepth,
      includeMarketRates: config.includeMarketData,
      includeProviders: config.includeProviders ?? true,
      saveAnalysis: true
    }, {
      timeout: 180000, // 3 minutos para análisis con IA
    });
    return response.data;
  }

  /**
   * Análisis de PDF
   * ✅ Con timeout extendido específico
   */
  async analyzePdf(formData: FormData) {
    const response = await this.client.post('/budget-analysis/pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minutos para PDFs grandes
    });
    return response.data.data || response.data;
  }

  /**
   * Obtener análisis por ID
   */
  async getAnalysisById(analysisId: string) {
    const response = await this.client.get(`/budget-analysis/pdf/${analysisId}`);
    return response.data.data;
  }

  /**
   * Obtener historial de análisis del usuario
   */
  async getAnalysisHistory(limit: number = 20, offset: number = 0): Promise<HistoryResponse> {
    console.log('📚 Solicitando historial, limit:', limit, 'offset:', offset);
    const response = await this.client.get('/budget-analysis/history', {
      params: { limit, offset },
    });
    console.log('✅ Historial recibido:', response.data);
    return response.data;
  }

  /**
   * Health check del servicio
   */
  async healthCheck() {
    const response = await this.client.get('/budget-analysis/health');
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
    const response = await this.client.post('/budget-analysis/validate-config', config);
    return response.data;
  }

  /**
   * Validar datos de proyecto
   */
  async validateProject(projectData: Partial<ProjectData>) {
    const response = await this.client.post('/budget-analysis/validate-project', projectData);
    return response.data;
  }

  /**
   * Comparar múltiples análisis PDF
   */
  async comparePdfAnalyses(
    analysisIds: string[],
    comparisonType: 'materials' | 'labor' | 'providers' | 'total_cost' = 'total_cost'
  ) {
    const response = await this.client.post('/budget-analysis/pdf/compare', {
      analysisIds,
      comparisonType
    });
    return response.data;
  }
}

// ==========================================
// EXPORTACIONES
// ==========================================

export const apiClient = new ApiClient();

// API de Budget Analyzer con todas las funciones
export const analyzeApi = {
  // Análisis
  analyzeProject: (projectData: ProjectData, config: AnalysisConfig) => 
    apiClient.analyzeProject(projectData, config),
  
  analyzePdf: (formData: FormData) => 
    apiClient.analyzePdf(formData),
  
  // Consultas
  getById: (id: string) => 
    apiClient.getAnalysisById(id),
  
  getHistory: (limit?: number, offset?: number) => 
    apiClient.getAnalysisHistory(limit, offset),
  
  // Validaciones
  validateConfig: (config: any) => 
    apiClient.validateConfig(config),
  
  validateProject: (projectData: Partial<ProjectData>) => 
    apiClient.validateProject(projectData),
  
  // Comparaciones
  comparePdfAnalyses: (analysisIds: string[], comparisonType?: 'materials' | 'labor' | 'providers' | 'total_cost') =>
    apiClient.comparePdfAnalyses(analysisIds, comparisonType),
  
  // Utilidades
  health: () => 
    apiClient.healthCheck(),
  
  setTokenGetter: (getter: () => Promise<string | null>) => 
    apiClient.setTokenGetter(getter),
};

// Export por defecto
export default apiClient;