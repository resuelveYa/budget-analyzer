// components/analyzer/TextBudgetAnalyzer.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Calculator, MapPin, Building, TrendingUp, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/api/client';
import Logo from '../logo';
import { UsageBadge } from '../usage/UsageBadge';
import budgetAnalyzerApi from '@/lib/api/budgetAnalyzerApi';

interface ProjectData {
  type: 'residential' | 'commercial' | 'industrial' | 'infrastructure' | 'renovation';
  location: string;
  area: number;
  estimatedBudget?: number;
  description: string;
}

interface AnalysisConfig {
  analysisDepth: 'basic' | 'standard' | 'detailed';
  includeMarketData: boolean;
}

export default function TextBudgetAnalyzer() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<ProjectData>({
    type: 'residential',
    location: '',
    area: 0,
    estimatedBudget: 0,
    description: ''
  });

  const [config, setConfig] = useState<AnalysisConfig>({
    analysisDepth: 'standard',
    includeMarketData: true
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  useEffect(() => {
    apiClient.setTokenGetter(getToken);
  }, [getToken]);

  const validateForm = () => {
    if (formData.type && formData.location && formData.area > 0) {
      setValidationStatus('valid');
      return true;
    }
    setValidationStatus('invalid');
    return false;
  };

  const formatChileanNumber = (value: number | string): string => {
    if (!value && value !== 0) return '';
    const numStr = value.toString().replace(/\./g, '');
    return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const parseChileanNumber = (value: string): number => {
    const cleanValue = value.replace(/\./g, '');
    return parseFloat(cleanValue) || 0;
  };

  const handleInputChange = (field: keyof ProjectData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setTimeout(validateForm, 300);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      console.log('🚀 Iniciando análisis con datos:', formData, config);
      const response = await budgetAnalyzerApi.analyzeProject(formData, config);
      console.log('✅ Respuesta recibida:', response);
      
      // ✅ GUARDAR con el ID correcto del backend
      const analysisId = response.data?.analysis_id || response.analysis_id || `analysis_${Date.now()}`;
      localStorage.setItem(analysisId, JSON.stringify(response));
      console.log('💾 Análisis guardado en localStorage con ID:', analysisId);
      
      setResult(response);
    } catch (err: any) {
      console.error('❌ Error en análisis:', err);
      setError(err.response?.data?.message || err.message || 'Error al generar el análisis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleViewFullAnalysis = () => {
    if (result) {
      // ✅ Usar el mismo ID que guardamos en localStorage
      const analysisId = result.data?.analysis_id || result.analysis_id || `analysis_${Date.now()}`;
      console.log('🔗 Navegando a análisis con ID:', analysisId);
      router.push(`/analysis/${analysisId}`);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // 🔥 FUNCIÓN ACTUALIZADA: Extrae presupuesto de la nueva estructura
  const extractBudget = (analysis: any) => {
    const data = analysis?.data?.analysis;
    
    // Prioridad 1: presupuesto_estimado.total_clp (nueva estructura)
    if (data?.presupuesto_estimado?.total_clp) {
      return data.presupuesto_estimado.total_clp;
    }
    
    // Prioridad 2: desglose_costos.total (estructura alternativa)
    if (data?.desglose_costos?.total) {
      return data.desglose_costos.total;
    }
    
    // Fallback: presupuesto_ajustado (estructura antigua)
    if (data?.presupuesto_ajustado) {
      const match = data.presupuesto_ajustado.match(/[\d.,]+/);
      return match ? parseFloat(match[0].replace(/\./g, '').replace(',', '.')) : 0;
    }
    
    // Si nada funciona, retornar el presupuesto estimado del form
    return formData.estimatedBudget || 0;
  };

  // 🔥 FUNCIÓN ACTUALIZADA: Extrae desglose de porcentajes
  const extractBreakdown = (analysis: any) => {
    const data = analysis?.data?.analysis;
    
    // Prioridad 1: presupuesto_estimado con porcentajes (nueva estructura)
    if (data?.presupuesto_estimado) {
      const budget = data.presupuesto_estimado;
      return {
        'Materiales': budget.materials_percentage || 0,
        'Mano de Obra': budget.labor_percentage || 0,
        'Equipos': budget.equipment_percentage || 0,
        'Gastos Generales': budget.overhead_percentage || 0
      };
    }
    
    // Prioridad 2: Calcular porcentajes desde desglose_costos
    if (data?.desglose_costos) {
      const breakdown = data.desglose_costos;
      const total = breakdown.total || breakdown.subtotal || 1;
      
      return {
        'Materiales': parseFloat(((breakdown.materiales || 0) / total * 100).toFixed(1)),
        'Mano de Obra': parseFloat(((breakdown.mano_obra || 0) / total * 100).toFixed(1)),
        'Equipos': parseFloat(((breakdown.equipos || 0) / total * 100).toFixed(1)),
        'Gastos Generales': parseFloat(((breakdown.gastos_generales || 0) / total * 100).toFixed(1))
      };
    }
    
    // Fallback: Valores por defecto
    return {
      'Materiales': 45,
      'Mano de Obra': 35,
      'Equipos': 12,
      'Gastos Generales': 8
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="mb-6">
            <Logo size="lg" showText={false} href={undefined} className="mx-auto" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Análisis Presupuestario con IA
          </h1>
          <p className="text-xl text-blue-100">
            Genera estimaciones precisas en minutos
          </p>
          <div className="mt-4">
            <UsageBadge metric="daily_analyses" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Building className="mr-2 h-5 w-5" />
                  Datos del Proyecto
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Completa la información básica
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAnalyze} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Tipo de Proyecto *
                    </label>
                    <Select
                      value={formData.type}
                      onValueChange={(v: any) => handleInputChange('type', v)}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Residencial</SelectItem>
                        <SelectItem value="commercial">Comercial</SelectItem>
                        <SelectItem value="industrial">Industrial</SelectItem>
                        <SelectItem value="infrastructure">Infraestructura</SelectItem>
                        <SelectItem value="renovation">Renovación</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Ubicación *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-5 w-5 text-blue-300" />
                      <input
                        type="text"
                        placeholder="Ej: Valdivia, Los Ríos"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Área (m²) *
                      </label>
                      <input
                        type="number"
                        placeholder="120"
                        value={formData.area || ''}
                        onChange={(e) => handleInputChange('area', parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Presupuesto Est. (CLP)
                      </label>
                      <input
                        type="text"
                        placeholder="75.000.000"
                        value={formData.estimatedBudget ? formatChileanNumber(formData.estimatedBudget) : ''}
                        onChange={(e) => {
                          const rawValue = parseChileanNumber(e.target.value);
                          handleInputChange('estimatedBudget', rawValue);
                        }}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Descripción
                    </label>
                    <textarea
                      placeholder="Casa habitacional 2 pisos, terreno en pendiente..."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                    />
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-4">Configuración</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Profundidad
                        </label>
                        <Select
                          value={config.analysisDepth}
                          onValueChange={(v: any) => setConfig(p => ({ ...p, analysisDepth: v }))}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">Básico</SelectItem>
                            <SelectItem value="standard">Estándar</SelectItem>
                            <SelectItem value="detailed">Detallado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2 pt-7">
                        <input
                          type="checkbox"
                          id="marketData"
                          checked={config.includeMarketData}
                          onChange={(e) => setConfig(p => ({ ...p, includeMarketData: e.target.checked }))}
                          className="rounded border-white/20"
                        />
                        <label htmlFor="marketData" className="text-sm text-white">
                          Incluir datos de mercado
                        </label>
                      </div>
                    </div>
                  </div>

                  {validationStatus === 'valid' && !isAnalyzing && !result && (
                    <div className="flex items-center space-x-2 text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm">Listo para analizar</span>
                    </div>
                  )}

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    disabled={isAnalyzing || validationStatus !== 'valid'}
                    className="w-full h-14 text-lg bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500"
                    size="lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                        Analizando con IA...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="mr-2 h-6 w-6" />
                        Generar Análisis
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            {!result && !isAnalyzing && (
              <Card className="bg-white/10 backdrop-blur-lg border-white/20 h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <Calculator className="w-20 h-20 text-blue-300 mx-auto mb-4 opacity-50" />
                  <p className="text-blue-100">Los resultados aparecerán aquí</p>
                </CardContent>
              </Card>
            )}

            {isAnalyzing && (
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardContent className="py-12 text-center">
                  <Loader2 className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-spin" />
                  <p className="text-white font-medium">Analizando proyecto...</p>
                  <p className="text-blue-200 text-sm mt-2">Esto puede tomar 30-60 segundos</p>
                </CardContent>
              </Card>
            )}

            {result && !isAnalyzing && (
              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 border-0">
                <CardHeader>
                  <CardTitle className="text-white">Presupuesto Estimado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-white/80 text-sm mb-2">Total Estimado</p>
                    <p className="text-5xl font-bold text-white">
                      {formatCurrency(extractBudget(result))}
                    </p>
                  </div>

                  <div className="bg-white/20 rounded-lg p-4 space-y-2">
                    <h4 className="text-white font-medium mb-3">Desglose</h4>
                    {Object.entries(extractBreakdown(result)).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex justify-between text-white/90 text-sm">
                        <span>{key}</span>
                        <span className="font-semibold">{value}%</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={handleViewFullAnalysis}
                    className="w-full bg-white text-green-600 hover:bg-white/90"
                  >
                    Ver Análisis Completo
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}