import axios, { AxiosInstance } from 'axios';

class ApiClient {
  private client: AxiosInstance;
  private getTokenFunction: (() => Promise<string | null>) | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || '/api/backend',
      timeout: 120000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

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
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => {
        console.log('✅ Response:', response.status, response.config.url);
        return response;
      },
      (error) => {
        console.error('❌ Error Response:', error.response?.status, error.config?.url);
        if (error.response?.status === 401) {
          window.location.href = '/sign-in';
        }
        return Promise.reject(error);
      }
    );
  }

  setTokenGetter(getter: () => Promise<string | null>) {
    this.getTokenFunction = getter;
  }

  // Análisis rápido (sin proyecto) - ENDPOINT CORRECTO
  async analyzeProject(projectData: any, config: any) {
    console.log('📊 Enviando análisis rápido:', projectData);
    const response = await this.client.post('/budget-analysis/quick', {
      ...projectData,
      analysisDepth: config.analysisDepth,
      includeMarketRates: config.includeMarketData,
      includeProviders: true
    });
    return response.data;
  }

  // Análisis de PDF
  async analyzePdf(formData: FormData) {
    const response = await this.client.post('/budget-analysis/pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data || response.data;
  }

  async getAnalysisById(analysisId: string) {
    const response = await this.client.get(`/budget-analysis/pdf/${analysisId}`);
    return response.data.data;
  }

  async getAnalysisHistory(limit: number = 10) {
    const response = await this.client.get('/budget-analysis/history', {
      params: { limit },
    });
    return response.data.data;
  }

  async getUsageStats() {
    const response = await this.client.get('/budget-analysis/usage/stats');
    return response.data.data;
  }

  async healthCheck() {
    const response = await this.client.get('/budget-analysis/health');
    return response.data;
  }
}

export const apiClient = new ApiClient();

export const analyzeApi = {
  analyzeProject: (projectData: any, config: any) => apiClient.analyzeProject(projectData, config),
  analyzePdf: (formData: FormData) => apiClient.analyzePdf(formData),
  getById: (id: string) => apiClient.getAnalysisById(id),
  getHistory: (limit?: number) => apiClient.getAnalysisHistory(limit),
  getStats: () => apiClient.getUsageStats(),
  health: () => apiClient.healthCheck(),
  setTokenGetter: (getter: () => Promise<string | null>) => apiClient.setTokenGetter(getter),
};
