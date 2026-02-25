// components/analyzer/PdfUploadZone.tsx
'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, X, Loader2, CheckCircle, AlertCircle, ArrowRight, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import budgetAnalyzerApi from '@/lib/api/budgetAnalyzerApi';
import { toast } from 'sonner';

// Tipos de proyecto soportados
const PROJECT_TYPES = [
  { value: 'vial_mop', label: '🛣️ Obra vial MOP', description: 'Manual de Carreteras, puentes, conservación vial' },
  { value: 'municipal', label: '🏛️ Municipalidad', description: 'Bacheo, mobiliario urbano, mantención comunal' },
  { value: 'general', label: '📂 Proyecto General', description: 'Cualquier otro tipo de obra (análisis flexible)' },
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
  const [projectType, setProjectType] = useState<ProjectType>('vial_mop');
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
      file => file.name.toLowerCase().endsWith('.pdf') ||
        file.name.toLowerCase().endsWith('.xlsx') ||
        file.name.toLowerCase().endsWith('.dwg') ||
        file.name.toLowerCase().endsWith('.dxf')
    );

    if (droppedFiles.length === 0) {
      setError('Solo se permiten archivos PDF, Excel y CAD (.dwg, .dxf)');
      return;
    }

    setFiles(prev => [...prev, ...droppedFiles].slice(0, 10));
    setError(null);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selectedFiles = Array.from(e.target.files).filter(
      file => file.name.toLowerCase().endsWith('.pdf') ||
        file.name.toLowerCase().endsWith('.xlsx') ||
        file.name.toLowerCase().endsWith('.dwg') ||
        file.name.toLowerCase().endsWith('.dxf')
    );

    setFiles(prev => [...prev, ...selectedFiles].slice(0, 10));
    setError(null);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const [logs, setLogs] = useState<{ type: string, message: string, file?: string }[]>([]);

  const handleAnalyze = async () => {
    if (files.length === 0) {
      setError('Debes seleccionar al menos un archivo (PDF, Excel o CAD)');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);
    setLogs([]);
    setResult(null);

    try {
      console.log('📄 Iniciando análisis de proyecto con streaming...');

      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      formData.append('projectType', projectType);

      // Obtener token para la petición manual
      let token = '';
      try {
        const { getAccessToken } = await import('@/lib/supabase/client');
        token = await getAccessToken() || '';
      } catch (e) {
        console.error('Error obteniendo token para streaming:', e);
      }

      // Usar fetch directamente para manejar el stream (SSE/NDJSON)
      // Corregir URL: quitar /api/ extra si process.env.NEXT_PUBLIC_API_URL ya lo tiene
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/api$/, '');
      const response = await fetch(`${baseUrl}/api/budget-analysis/project/stream`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (response.status === 401) {
        toast.error('Sesión expirada. Redirigiendo al login...');
        setTimeout(() => {
          const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'http://localhost:3000';
          window.location.href = `${landingUrl}/sign-in`;
        }, 2000);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error en el servidor: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No se pudo iniciar el lector de stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Procesar líneas completas del stream SSE (data: ...)
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Guardar remanente incompleto

        for (const line of lines) {
          // Soportar tanto NDJSON puro como SSE con prefijo "data: "
          const trimmed = line.trim();
          if (!trimmed) continue;

          let jsonStr = trimmed;
          if (trimmed.startsWith('data: ')) {
            jsonStr = trimmed.slice(6).trim();
          } else if (trimmed.startsWith(':')) {
            // Comentario SSE (heartbeat del servidor, ignorar)
            continue;
          }
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);
            console.log('📡 Evento de progreso:', event);

            if (event.type === 'ping') {
              // Heartbeat: mantener conexión activa, no mostrar en logs
              setUploadProgress(prev => Math.min(prev + 1, 89));
            } else if (event.type === 'error') {
              setError(event.message);
            } else if (event.type === 'data') {
              // Resultado final recibido por stream
              setResult(event);
              onAnalysisComplete?.(event);
            } else if (event.type === 'final_result') {
              // Compatible con formato directo de Python si llegara así
              const wrapped = { data: { analysis: event.data, analysis_id: `project_${Date.now()}` } };
              setResult(wrapped);
              onAnalysisComplete?.(wrapped);
            } else {
              // Agregar a la lista de logs
              setLogs(prev => [...prev, event].slice(-20)); // Mantener últimos 20

              // Actualizar progreso estimado según tipo de mensaje
              if (event.type === 'step') setUploadProgress(prev => Math.min(prev + 10, 90));
            }
          } catch (e) {
            console.warn('⚠️ Error parseando fragmento de stream:', line);
          }
        }
      }

    } catch (err: any) {
      console.error('❌ Error en análisis streaming:', err);
      setError(err.message || 'Error al analizar los archivos');
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
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
          Subir Documentos (PDF/Excel/CAD)
        </CardTitle>
        <CardDescription className="text-blue-100">
          Arrastra tus archivos PDF, .xlsx, .dwg o .dxf (máx. 10 archivos)
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
            accept=".pdf,.xlsx,.dwg,.dxf"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-cyan-400' : 'text-blue-300'}`} />
          <p className="text-white font-medium mb-1">
            {isDragging ? 'Suelta los archivos aquí' : 'Arrastra archivos aquí'}
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

        {/* Upload Progress & Logs */}
        {isUploading && (
          <div className="space-y-4">
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

            {/* Real-time Logs Terminal */}
            <div className="bg-black/40 rounded-xl border border-white/10 p-4 font-mono text-xs overflow-hidden">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                <span className="text-blue-300 flex items-center">
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  PROCESANDO...
                </span>
                <span className="text-white/40">v2.1.0-haiku</span>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-hide flex flex-col-reverse">
                {logs.length === 0 ? (
                  <p className="text-white/30 italic">Iniciando motor de análisis...</p>
                ) : (
                  [...logs].reverse().map((log, i) => (
                    <div key={i} className="flex gap-2 animate-in fade-in slide-in-from-left-2">
                      <span className={`${log.type === 'step' ? 'text-cyan-400' :
                        log.type === 'ai_pass' ? 'text-purple-400' :
                          log.type === 'success' ? 'text-green-400' :
                            log.type === 'error' ? 'text-red-400' : 'text-blue-200'
                        }`}>
                        [{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                      </span>
                      <span className="text-white/80">{log.message}</span>
                      {log.file && <span className="text-white/30 text-[10px] truncate max-w-[100px]">({log.file})</span>}
                    </div>
                  ))
                )}
              </div>
            </div>
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
                        ...rawAnalysis, // Pasar TODO el objeto original para no perder datos
                        // Asegurar compatibilidad campos principales
                        resumen_ejecutivo: rawAnalysis?.resumen_ejecutivo
                          || rawAnalysis?.resumen_consolidado?.resumen_ejecutivo
                          || 'Análisis de múltiples documentos PDF completado.',
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
                        }
                      },
                      project_info: rawAnalysis?.project_info || {
                        name: rawAnalysis?.proyecto || 'Proyecto Consolidado',
                        location: 'Chile',
                        type: 'Proyecto MOP',
                        status: 'Análisis Consolidado'
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
              Analizando archivos...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-5 w-5" />
              Analizar {files.length > 0 ? `${files.length} archivo(s)` : 'Documentos'}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
