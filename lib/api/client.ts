// lib/api/client.ts - VERSIÓN LIMPIA SIN DUPLICACIÓN
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

// ==========================================
// CLIENTE API BASE - SOLO HTTP GENÉRICO
// ==========================================

class ApiClient {
  private client: AxiosInstance;
  private getTokenFunction: (() => Promise<string | null>) | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL ||
        (process.env.NODE_ENV === 'development'
          ? '/api/backend'
          : '/api'),
      timeout: 180000, // 3 minutos para análisis con IA
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    // Interceptor de request
    this.client.interceptors.request.use(
      async (config) => {
        if (this.getTokenFunction) {
          const token = await this.getTokenFunction();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => {
        console.error('❌ Error en request interceptor:', error);
        return Promise.reject(error);
      }
    );

    // Interceptor de response
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

        // Manejo de timeouts
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          console.error('⏱️ Timeout detectado');
          return Promise.reject({
            ...error,
            message: 'El análisis está tardando más de lo esperado. Por favor, intenta nuevamente.'
          });
        }

        // Manejo de 401
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
  // MÉTODOS HTTP GENÉRICOS
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
}

// Exportar instancia única
export const apiClient = new ApiClient();
export default apiClient;