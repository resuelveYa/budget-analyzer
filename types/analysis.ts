// src/types/budgetAnalysis.ts - VERSIÓN CORREGIDA COMPATIBLE CON BACKEND OPTIMIZADO

export interface ProjectData {
  id?: string;
  name?: string;
  type: 'residential' | 'commercial' | 'industrial' | 'infrastructure' | 'renovation';
  location: string;
  area: number;
  estimatedBudget?: number;
  description?: string;
  startDate?: string;
  client?: string;
  address?: string;
  floors?: number;
  bedrooms?: number;
  bathrooms?: number;
}

export interface AnalysisConfig {
  analysisDepth?: 'basic' | 'standard' | 'detailed';
  includeMarketData?: boolean;
  includeHistoricalData?: boolean;
  saveAnalysis?: boolean;
}

export interface BudgetBreakdown {
  porcentaje?: string;
  monto?: string;
  observaciones?: string;
}

export interface RegionalFactors {
  climaticos?: string;
  logisticos?: string;
  mano_obra?: string;
  normativos?: string;
}

export interface RiskAnalysis {
  riesgo: string;
  probabilidad: string;
  impacto: string;
  mitigacion: string;
}

// ✅ NUEVA: Estructura de análisis parseado del JSON
export interface ParsedAnalysis {
  resumen_ejecutivo: string;
  presupuesto_ajustado: string;
  desglose_detallado?: {
    estructura?: BudgetBreakdown;
    albañilería?: BudgetBreakdown;
    terminaciones?: BudgetBreakdown;
    instalaciones?: BudgetBreakdown;
    otros?: BudgetBreakdown;
    [key: string]: BudgetBreakdown | undefined; // Para permitir otras partidas
  };
  desglose_principal?: {
    estructura?: string;
    terminaciones?: string;
    instalaciones?: string;
    [key: string]: string | undefined;
  };
  factores_regionales?: RegionalFactors;
  analisis_riesgos?: RiskAnalysis[];
  factores_riesgo?: string[];
  recomendaciones?: string[];
  cronograma_sugerido?: string;
  contingencia_recomendada?: string;
  
  // Metadatos del análisis
  metadata?: {
    generated_at: string;
    model_used: string;
    project_id: string | null;
    confidence_score: number;
    api_cost_estimate: {
      input_tokens: number;
      output_tokens: number;
      estimated_cost_usd: number;
      estimated_cost_clp: number;
    };
  };
}

// ✅ ACTUALIZADA: Respuesta completa del servicio
export interface AnalysisResponse {
  success: boolean;
  message: string;
  data: {
    analysis: BudgetAnalysis;
    project_info: {
      id: string;
      name: string;
      location: string;
      estimated_budget?: number;
    };
    analysis_config: AnalysisConfig;
  };
  timestamp: string;
}

export interface ValidationResponse {
  success: boolean;
  message: string;
  data: {
    confidence_score: number;
    is_analyzable: boolean;
    readiness_level: 'excellent' | 'good' | 'fair' | 'poor';
    suggestions: string[];
    estimated_analysis_quality: 'high' | 'medium' | 'basic';
  };
  timestamp: string;
}

export interface AnalysisHistoryItem {
  id: string;
  created_at: string;
  confidence_score: number;
  estimated_budget: number;
  summary: string;
}

export interface HealthCheckResponse {
  success: boolean;
  service: string;
  status: 'healthy' | 'unhealthy';
  checks: {
    api_key_configured: boolean;
    anthropic_service: string;
    database_connection: string;
  };
  capabilities: string[];
  supported_regions: string[];
  timestamp: string;
}

// Estados de loading y error
export interface BudgetAnalysisState {
  isLoading: boolean;
  isValidating: boolean;
  analysis: BudgetAnalysis | null;
  error: string | null;
  validationResult: ValidationResponse['data'] | null;
}

// Para formularios
export interface BudgetAnalysisFormData extends ProjectData {
  analysisDepth: 'basic' | 'standard' | 'detailed';
  includeMarketData: boolean;
  saveAnalysis: boolean;
}

// ✅ TIPOS PARA PDF ANALYSIS - CORREGIDOS PARA BACKEND OPTIMIZADO
export interface PdfAnalysisConfig {
  analysisDepth?: 'basic' | 'standard' | 'detailed';
  includeProviders?: boolean;
  projectType?: 'residential' | 'commercial' | 'industrial' | 'infrastructure' | 'renovation';
  projectLocation?: string;
  maxCostEstimate?: number;
  saveAnalysis?: boolean;
}

export interface PdfAnalysisProgress {
  stage: 'uploading' | 'extracting' | 'chunking' | 'analyzing' | 'consolidating' | 'complete';
  progress: number;
  currentChunk?: number;
  totalChunks?: number;
  message: string;
}

// 🔥 ESTRUCTURA ACTUALIZADA para backend optimizado
export interface PdfAnalysisResult {
  analysisId: string;
  analysis: {
    resumen_ejecutivo: string;
    presupuesto_estimado: {
      total_clp: number;
      materials_percentage: number;
      labor_percentage: number;
      equipment_percentage: number;
      overhead_percentage?: number; // 🔥 OPCIONAL para compatibilidad
    };
    materiales_detallados: Array<{
      item: string;
      cantidad: number;
      unidad: string;
      precio_unitario: number;
      subtotal: number;
      categoria: string;
    }>;
    mano_obra: Array<{
      especialidad: string;
      cantidad_personas: number;
      horas_totales: number;
      tarifa_hora: number;
      subtotal: number;
    }>;
    equipos_maquinaria: Array<{
      tipo_equipo: string;
      tiempo_uso: string;
      tarifa_periodo: number;
      subtotal: number;
    }>;
    proveedores_chile: Array<{
      nombre: string;
      contacto: string;
      especialidad: string;
    }>;
    analisis_riesgos: Array<{
      factor: string;
      probability: string;
      impact: string;
      mitigation: string;
    }>;
    recomendaciones: string[];
    cronograma_estimado: string;
    chunks_procesados: number;
    confidence_score: number;
    // 🔥 CAMPOS ADICIONALES del backend optimizado
    chunks_exitosos?: number;
    processing_method?: string;
    desglose_costos?: {
      materiales: number;
      mano_obra: number;
      equipos: number;
      gastos_generales: number;
      utilidad: number;
      total: number;
    };
    factores_regionales?: {
      market_conditions: string;
      logistics: string;
      local_regulations: string;
      climate_impact: string;
    };
    extraction_metadata?: any;
  };
  metadata: {
    chunksProcessed: number;
    originalFileSize: number;
    textLength: number;
    processingTime: string;
    // 🔥 CAMPOS ADICIONALES del backend optimizado
    originalFileName?: string;
    processingTimeMs?: number;
    extraction?: {
      method: string;
      confidence: number;
      chunks_processed: number;
      chunks_successful: number;
    };
    optimization?: {
      cost_estimate_usd: number;
      cost_estimate_clp: number;
      model_used: string;
      optimization_applied: boolean;
      cost_warning: string;
    };
  };
}

// ✅ NUEVA: Type guards para verificar estructura
export function isParsedAnalysis(analysis: any): analysis is ParsedAnalysis {
  return analysis && 
         typeof analysis === 'object' && 
         typeof analysis.resumen_ejecutivo === 'string' &&
         typeof analysis.presupuesto_ajustado === 'string';
}

export function hasDetailedBreakdown(analysis: ParsedAnalysis): boolean {
  return !!(analysis.desglose_detallado && 
            Object.keys(analysis.desglose_detallado).length > 0);
}

export function hasRiskAnalysis(analysis: ParsedAnalysis): boolean {
  return !!(analysis.analisis_riesgos && 
            Array.isArray(analysis.analisis_riesgos) && 
            analysis.analisis_riesgos.length > 0);
}

export function hasRecommendations(analysis: ParsedAnalysis): boolean {
  return !!(analysis.recomendaciones && 
            Array.isArray(analysis.recomendaciones) && 
            analysis.recomendaciones.length > 0);
}

// ✅ NUEVA: Helper para extraer y parsear contenido
export function parseAnalysisContent(analysis: BudgetAnalysis): ParsedAnalysis {
  try {
    // Si tiene contenido_original, extraer el JSON
    if (analysis.contenido_original && typeof analysis.contenido_original === 'string') {
      const jsonMatch = analysis.contenido_original.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[1]);
        return parsedData as ParsedAnalysis;
      }
    }
    
    // Si ya tiene la estructura correcta, usarla directamente
    if (analysis.desglose_detallado || analysis.presupuesto_ajustado) {
      return {
        resumen_ejecutivo: analysis.resumen_ejecutivo,
        presupuesto_ajustado: analysis.presupuesto_ajustado,
        desglose_detallado: analysis.desglose_detallado,
        factores_regionales: analysis.factores_regionales,
        analisis_riesgos: analysis.analisis_riesgos,
        recomendaciones: analysis.recomendaciones,
        cronograma_sugerido: analysis.cronograma_sugerido,
        contingencia_recomendada: analysis.contingencia_recomendada
      };
    }
    
    // Fallback: estructura básica
    return {
      resumen_ejecutivo: analysis.resumen_ejecutivo || "Análisis en proceso",
      presupuesto_ajustado: analysis.presupuesto_ajustado || "Por determinar",
      contingencia_recomendada: "20%"
    };
  } catch (error) {
    console.error('Error parseando análisis:', error);
    return {
      resumen_ejecutivo: "Error en análisis",
      presupuesto_ajustado: "Por revisar",
      contingencia_recomendada: "20%"
    };
  }
}

// 🔥 NUEVOS TIPOS para el sistema optimizado
export interface CostStatus {
  environment: string;
  global_usage: {
    daily: {
      date: string;
      cost_used: number;
      cost_limit: number;
      percentage_used: string;
      remaining: number;
    };
    hourly: {
      hour: string;
      analyses_count: number;
      analyses_limit: number;
      percentage_used: string;
      remaining: number;
    };
  };
  user_usage: {
    user_id: string;
    daily_cost: number;
    daily_limit: number;
    percentage_used: string;
    remaining: number;
  };
  system_health: {
    is_healthy: boolean;
    tracked_days: number;
    tracked_hours: number;
    tracked_users: number;
    last_cleanup: string;
  };
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
    daily_cost: string;
  };
  optimization_stats: {
    average_cost_per_analysis: number;
    tokens_saved_this_month: number;
    cost_saved_usd: number;
    files_rejected_oversized: number;
    optimizations_applied: number;
  };
}

export interface FileValidationResult {
  isValid: boolean;
  warnings: string[];
  costEstimate: {
    estimated_cost_usd: number;
    estimated_cost_clp: number;
    cost_warning: string;
    chunks_to_process: number;
  };
  recommendation: 'ARCHIVO_OPTIMO_PARA_ANALISIS' | 'ARCHIVO_MEDIO_PROCEDER_CON_CUIDADO' | 'ARCHIVO_GRANDE_CONSIDERAR_REDUCIR' | 'ERROR';
}

export interface ProcessingTimeEstimate {
  estimatedSeconds: number;
  category: 'fast' | 'medium' | 'slow';
  description: string;
  optimizations: string[];
}

// 🔥 TIPOS DE ERROR específicos del sistema optimizado
export type OptimizedSystemError = 
  | 'COST_LIMIT_EXCEEDED'
  | 'DAILY_COST_LIMIT'
  | 'HOURLY_ANALYSIS_LIMIT'
  | 'USER_DAILY_LIMIT'
  | 'WOULD_EXCEED_DAILY_LIMIT'
  | 'WOULD_EXCEED_USER_LIMIT'
  | 'INVALID_FILE'
  | 'FILE_TOO_LARGE'
  | 'RATE_LIMIT'
  | 'ANALYSIS_ERROR'
  | 'VALIDATION_ERROR';

export interface OptimizedErrorResponse {
  success: false;

  error: {
    message: string;
    code: OptimizedSystemError;
    suggestions?: string[];
    retryAfter?: number;  // más consistente en camelCase
    timestamp: string;
  };

  costs?: {
    estimatedUsd?: number;
    warning?: string;
    current?: number;
    limit?: number;
  };

  projectDetails?: {
    terminaciones?: string;
    instalaciones?: string;
    [key: string]: string | undefined; // mantiene flexibilidad
  };

  factoresRegionales?: RegionalFactors;
  analisisRiesgos?: RiskAnalysis[];
  factoresRiesgo?: string[];
  recomendaciones?: string[];
  cronogramaSugerido?: string;
  contingenciaRecomendada?: string;
}


// ✅ ACTUALIZADA: Estructura real que viene del backend
export interface BudgetAnalysis {
  // Campos que siempre vienen del backend
  resumen_ejecutivo: string;
  presupuesto_ajustado: string;
  nota: string;
  contenido_original: string; // ✅ AGREGADO: El JSON embebido en markdown
  
  // Campos opcionales que pueden venir directamente o parseados
  desglose_detallado?: {
    estructura?: BudgetBreakdown;
    albañilería?: BudgetBreakdown;
    terminaciones?: BudgetBreakdown;
    instalaciones?: BudgetBreakdown;
    otros?: BudgetBreakdown;
    [key: string]: BudgetBreakdown | undefined;
  };
  desglose_principal?: {
    estructura?: string;
    terminaciones?: string;
    instalaciones?: string;
    [key: string]: string | undefined;
  };
  factores_regionales?: RegionalFactors;
  analisis_riesgos?: RiskAnalysis[];
  factores_riesgo?: string[];
  recomendaciones?: string[];
  cronograma_sugerido?: string;
  contingencia_recomendada?: string;
  
  // Metadatos del análisis
  metadata?: {
    generated_at: string;
    model_used: string;
    project_id: string | null;
    confidence_score: number;
    api_cost_estimate: {
      input_tokens: number;
      output_tokens: number;
      estimated_cost_usd: number;
      estimated_cost_clp: number;
    };
  };
}