// components/analyzer/PdfUploadZone.tsx
'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, X, Loader2, CheckCircle, AlertCircle, ArrowRight, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import budgetAnalyzerApi from '@/lib/api/budgetAnalyzerApi';

// Tipos de proyecto soportados
const PROJECT_TYPES = [
  { value: 'auto', label: '🔍 Auto-detectar', description: 'El sistema detecta el tipo automáticamente' },
  { value: 'residencial', label: '🏠 Residencial', description: 'Casas, departamentos, condominios' },
  { value: 'comercial', label: '🏢 Comercial/Industrial', description: 'Oficinas, galpones, locales comerciales' },
  { value: 'vial', label: '🛣️ Infraestructura Vial', description: 'Caminos, puentes, conservación vial' },
  { value: 'edificacion', label: '🏛️ Edificación Pública', description: 'Hospitales, colegios, edificios públicos' },
  { value: 'sanitario', label: '💧 Obras Sanitarias', description: 'Agua potable, alcantarillado' },
  { value: 'metalico', label: '🔩 Infraestructuras Metálicas', description: 'Estructuras de acero, galpones metálicos' },
] as const;

type ProjectType = typeof PROJECT_TYPES[number]['value'];

interface PdfUploadZoneProps {
  onAnalysisComplete?: (result: any) => void;
}

export default function PdfUploadZone({ onAnalysisComplete }: PdfUploadZoneProps) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [projectType, setProjectType] = useState<ProjectType>('auto');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/pdf'
    );

    if (droppedFiles.length === 0) {
      setError('Solo se permiten archivos PDF');
      return;
    }

    setFiles(prev => [...prev, ...droppedFiles].slice(0, 10));
    setError(null);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selectedFiles = Array.from(e.target.files).filter(
      file => file.type === 'application/pdf'
    );

    setFiles(prev => [...prev, ...selectedFiles].slice(0, 10));
    setError(null);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleAnalyze = async () => {
    if (files.length === 0) {
      setError('Debes seleccionar al menos un archivo PDF');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      console.log('📄 Iniciando análisis de', files.length, 'PDFs');
      setUploadProgress(20);

      const response = await budgetAnalyzerApi.analyzePdfProject(files, {
        projectType: projectType,
        analysisDepth: 'deep'
      });

      setUploadProgress(100);
      console.log('✅ Análisis completado:', response);

      setResult(response);
      onAnalysisComplete?.(response);
    } catch (err: any) {
      console.error('❌ Error en análisis:', err);
      setError(err.response?.data?.message || err.message || 'Error al analizar los archivos');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Upload className="mr-2 h-5 w-5" />
          Subir Documentos PDF
        </CardTitle>
        <CardDescription className="text-blue-100">
          Arrastra tus archivos o haz clic para seleccionar (máx. 10 archivos)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Project Type Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white flex items-center">
            <Building2 className="w-4 h-4 mr-2" />
            Tipo de Proyecto
          </label>
          <select
            value={projectType}
            onChange={(e) => setProjectType(e.target.value as ProjectType)}
            className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white 
                       focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all
                       appearance-none cursor-pointer"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em" }}
          >
            {PROJECT_TYPES.map((type) => (
              <option key={type.value} value={type.value} className="bg-gray-800 text-white">
                {type.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-blue-200">
            {PROJECT_TYPES.find(t => t.value === projectType)?.description}
          </p>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-200
            ${isDragging
              ? 'border-cyan-400 bg-cyan-400/20'
              : 'border-white/30 hover:border-white/50 hover:bg-white/5'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-cyan-400' : 'text-blue-300'}`} />
          <p className="text-white font-medium mb-1">
            {isDragging ? 'Suelta los archivos aquí' : 'Arrastra PDFs aquí'}
          </p>
          <p className="text-blue-200 text-sm">
            o haz clic para seleccionar archivos
          </p>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <p className="text-white text-sm font-medium">
              {files.length} archivo(s) seleccionado(s)
            </p>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <FileText className="w-5 h-5 text-blue-300 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-white text-sm truncate">{file.name}</p>
                      <p className="text-blue-200 text-xs">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="p-1 hover:bg-red-500/20 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all duration-500"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-blue-200 text-sm text-center">
              Analizando documentos... esto puede tomar varios minutos
            </p>
          </div>
        )}

        {/* Success Result */}
        {result && !isUploading && (
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-xl p-5 space-y-4">
            <div className="flex items-center space-x-2 text-green-400">
              <CheckCircle className="w-6 h-6" />
              <span className="font-semibold text-lg">¡Análisis completado!</span>
            </div>

            {/* Preview del resumen */}
            {(result.data?.analysis?.resumen_ejecutivo || result.data?.resumen_ejecutivo) && (
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-white/80 text-sm font-medium mb-2">Resumen Ejecutivo:</p>
                <p className="text-white text-sm line-clamp-4">
                  {result.data?.analysis?.resumen_ejecutivo || result.data?.resumen_ejecutivo}
                </p>
              </div>
            )}

            {/* Stats rápidos */}
            <div className="flex gap-4 text-sm">
              <div className="bg-white/10 rounded-lg px-3 py-2">
                <span className="text-blue-200">Archivos:</span>
                <span className="text-white font-semibold ml-1">{result.data?.files_count || files.length}</span>
              </div>
              <div className="bg-white/10 rounded-lg px-3 py-2">
                <span className="text-blue-200">Tiempo:</span>
                <span className="text-white font-semibold ml-1">
                  {result.data?.processing_time_ms
                    ? `${(result.data.processing_time_ms / 1000).toFixed(1)}s`
                    : 'N/A'}
                </span>
              </div>
            </div>

            {/* Botón Ver Análisis Completo */}
            <Button
              onClick={() => {
                const analysisId = result.data?.analysis_id;
                if (analysisId) {
                  // Transformar respuesta del proyecto PDF al formato esperado por el frontend
                  const rawAnalysis = result.data?.analysis;

                  const transformedData = {
                    data: {
                      analysis_id: analysisId,
                      analysis_type: 'pdf',
                      analysis: {
                        // Campos principales
                        resumen_ejecutivo: rawAnalysis?.resumen_ejecutivo
                          || rawAnalysis?.resumen_consolidado?.resumen_ejecutivo
                          || 'Análisis de múltiples documentos PDF completado.',
                        resumen_consolidado: rawAnalysis?.resumen_consolidado,

                        presupuesto_estimado: {
                          total_clp: rawAnalysis?.presupuesto_estimado?.total_clp
                            || rawAnalysis?.resumen_consolidado?.total_con_iva
                            || 0,
                          neto_clp: rawAnalysis?.presupuesto_estimado?.neto_clp
                            || rawAnalysis?.resumen_consolidado?.total_neto
                            || 0,
                          iva_clp: rawAnalysis?.presupuesto_estimado?.iva_clp
                            || rawAnalysis?.resumen_consolidado?.iva
                            || 0
                        },

                        // Documentos analizados individualmente
                        archivos: rawAnalysis?.archivos || [],
                        archivos_analizados: rawAnalysis?.archivos || [],

                        // ===== NUEVOS CAMPOS TÉCNICOS =====
                        // Tramos de camino extraídos de tablas
                        tramos_camino: rawAnalysis?.tramos_camino || [],

                        // Cubicaciones (volúmenes, superficies, metros lineales)
                        cubicaciones: rawAnalysis?.cubicaciones || [],

                        // Items de presupuesto consolidados
                        items_presupuesto: rawAnalysis?.items_presupuesto || [],

                        // Normativas aplicables (vallas, señalización, seguridad)
                        normativas_aplicables: rawAnalysis?.normativas_aplicables || {
                          vallas_camineras: null,
                          senalizacion: [],
                          seguridad: []
                        },

                        // Especificaciones técnicas (perfiles tipo, materiales)
                        especificaciones_tecnicas: rawAnalysis?.especificaciones_tecnicas || [],

                        // Comunidades indígenas (participación ciudadana)
                        comunidades_indigenas: rawAnalysis?.comunidades_indigenas || [],

                        // Campos para compatibilidad con vista antigua
                        analisis_riesgos: rawAnalysis?.analisis_riesgos || [],
                        recomendaciones: rawAnalysis?.recomendaciones || [],
                        factores_regionales: rawAnalysis?.factores_regionales || {},
                        confidence_score: 75
                      },
                      project_info: rawAnalysis?.project_info || {
                        name: rawAnalysis?.proyecto || 'Proyecto Consolidado',
                        location: 'Ver documentos individuales',
                        type: 'Proyecto MOP',
                        status: 'Análisis Consolidado',
                        longitud_total_km: rawAnalysis?.project_info?.longitud_total_km || 0,
                        total_tramos: rawAnalysis?.project_info?.total_tramos || 0,
                        total_comunidades: rawAnalysis?.project_info?.total_comunidades || 0
                      },
                      files_count: result.data?.files_count || files.length,
                      processing_time_ms: result.data?.processing_time_ms
                    }
                  };

                  console.log('💾 Guardando análisis transformado:', transformedData);
                  localStorage.setItem(analysisId, JSON.stringify(transformedData));
                  router.push(`/analysis/${analysisId}`);
                }
              }}
              className="w-full h-12 text-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              Ver Análisis Completo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Analyze Button */}
        <Button
          onClick={handleAnalyze}
          disabled={files.length === 0 || isUploading}
          className="w-full h-12 text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Analizando PDFs...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-5 w-5" />
              Analizar {files.length > 0 ? `${files.length} PDF(s)` : 'PDFs'}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
