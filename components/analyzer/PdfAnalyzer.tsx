'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { FileText, Upload, Loader2, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';
import FullAnalysisView from './FullAnalysisView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/api/client';
import budgetAnalyzerApi from '@/lib/api/budgetAnalyzerApi';

interface PdfAnalysisProgress {
  stage: 'uploading' | 'extracting' | 'analyzing' | 'complete';
  progress: number;
  message: string;
}

import { useAuth } from '@/components/auth/AuthContext';

export default function PdfAnalyzer() {
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState<PdfAnalysisProgress | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [config, setConfig] = useState({
    analysisDepth: 'standard' as 'quick' | 'standard' | 'deep',
    projectType: 'auto' as 'residencial' | 'comercial' | 'vial' | 'edificacion' | 'sanitario' | 'metalico' | 'auto',
    projectLocation: 'Santiago, Chile',
    includeProviders: true,
  });

  const handleFileSelect = useCallback((selectedFiles: FileList | File[]) => {
    const newFiles: File[] = [];
    const maxSize = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '10485760');

    Array.from(selectedFiles).forEach(file => {
      if (file.type !== 'application/pdf') {
        setError('Solo se permiten archivos PDF');
        return;
      }
      if (file.size > maxSize) {
        setError(`El archivo ${file.name} es muy grande. Máximo ${(maxSize / 1024 / 1024).toFixed(0)} MB`);
        return;
      }
      newFiles.push(file);
    });

    setFiles(prev => [...prev, ...newFiles]);
    setError(null);
    setResult(null);
  }, []);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleAnalyze = async () => {
    if (files.length === 0) {
      setError('Debe seleccionar al menos un archivo');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setProgress({ stage: 'uploading', progress: 0, message: 'Preparando archivos...' });

    try {
      const progressStages = [
        { stage: 'uploading', progress: 10, message: 'Subiendo archivos al servidor...' },
        { stage: 'extracting', progress: 30, message: 'Extrayendo texto con Tesseract...' },
        { stage: 'analyzing', progress: 60, message: 'Analizando contexto del proyecto con Claude...' },
        { stage: 'complete', progress: 90, message: 'Generando informe consolidado...' },
      ];

      // Animación de progreso simulada para mejor feedback
      for (const stage of progressStages) {
        if (!isAnalyzing) break;
        setProgress(stage as PdfAnalysisProgress);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      const response = await budgetAnalyzerApi.analyzePdfProject(files, config);

      console.log('✅ Respuesta recibida:', response);
      setResult(response.data?.analysis || response.data);
      setProgress({ stage: 'complete', progress: 100, message: 'Análisis finalizado' });

    } catch (err: any) {
      console.error('❌ Error en análisis:', err);
      setError(err.response?.data?.message || err.message || 'Error al analizar el proyecto');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          Análisis de Proyectos (Multi-PDF)
        </h1>
        <p className="text-muted-foreground text-lg">
          Sube tus anexos, bases y presupuestos para un análisis consolidado inteligente.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6 animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-2 border-primary/10 shadow-lg hover:shadow-primary/5 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                1. Subir Archivos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDragging ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-muted hover:border-primary/50'
                  }`}
              >
                <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Arrastra tus PDFs aquí</p>
                <p className="text-sm text-muted-foreground mb-6">Máximo 10 archivos (15MB c/u)</p>

                <Button variant="secondary" asChild disabled={isAnalyzing}>
                  <label className="cursor-pointer">
                    Seleccionar Archivos
                    <input
                      type="file"
                      accept="application/pdf"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) handleFileSelect(e.target.files);
                      }}
                    />
                  </label>
                </Button>
              </div>

              {files.length > 0 && (
                <div className="mt-6 space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Archivos seleccionados ({files.length})
                  </p>
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-card border rounded-lg group hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileText className="w-5 h-5 text-primary shrink-0" />
                          <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">{f.name}</p>
                            <p className="text-xs text-muted-foreground">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                          onClick={() => removeFile(i)}
                          disabled={isAnalyzing}
                        >
                          <span className="sr-only">Eliminar</span>
                          <AlertCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                2. Configuración
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Profundidad</label>
                <Select
                  value={config.analysisDepth}
                  onValueChange={(v: any) => setConfig(p => ({ ...p, analysisDepth: v }))}
                  disabled={isAnalyzing}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quick">Básico (Rápido)</SelectItem>
                    <SelectItem value="standard">Estándar</SelectItem>
                    <SelectItem value="deep">Detallado (Tesseract + Claude)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Ubicación (Región)</label>
                <div className="text-sm p-3 bg-muted/50 rounded-lg border text-muted-foreground">
                  {config.projectLocation} (Autodetectado)
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleAnalyze}
            disabled={files.length === 0 || isAnalyzing}
            className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all bg-gradient-to-r from-primary to-blue-600 border-none"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Procesando Proyecto...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-6 w-6" />
                Iniciar Análisis Consolidado
              </>
            )}
          </Button>
        </div>

        <div className="lg:col-span-2">
          {isAnalyzing && progress && (
            <Card className="border-none bg-primary/5 p-8 h-full flex flex-col justify-center items-center text-center space-y-8 animate-pulse">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150" />
                <Loader2 className="w-20 h-20 text-primary animate-spin relative" />
              </div>
              <div className="space-y-4 max-w-md">
                <h3 className="text-2xl font-bold">{progress.message}</h3>
                <Progress value={progress.progress} className="h-4 shadow-inner" />
                <div className="flex justify-between text-sm font-medium text-muted-foreground uppercase tracking-widest">
                  <span>{progress.stage}</span>
                  <span>{progress.progress}%</span>
                </div>
              </div>
              <p className="text-primary/60 italic">
                Estamos usando OCR local y Claude 3.5 para analizar todos tus documentos...
              </p>
            </Card>
          )}

          {result && !isAnalyzing && (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              {/* Aquí renderizaremos el FullAnalysisView con los resultados consolidados */}
              <Card className="p-0 border-none bg-transparent shadow-none">
                <FullAnalysisView analysis={result} isConsolidated={true} />
              </Card>
            </div>
          )}

          {!isAnalyzing && !result && (
            <Card className="h-full border-2 border-dashed border-muted flex flex-col items-center justify-center min-h-[500px] p-12 text-center opacity-60">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full scale-150" />
                <FileText className="w-32 h-32 text-muted-foreground relative" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">Tu Informe Aparecerá Aquí</h3>
              <p className="max-w-sm text-muted-foreground">
                Sube varios archivos (Anexo 1, 2, Bases, etc.) para comparar, validar ítems MOP y detectar inconsistencias automáticamente.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
