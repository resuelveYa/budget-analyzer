'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { FileText, Upload, Loader2, AlertCircle } from 'lucide-react';
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
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState<PdfAnalysisProgress | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [config, setConfig] = useState({
    analysisDepth: 'standard' as 'basic' | 'standard' | 'detailed',
    projectType: 'residential' as 'residential' | 'commercial' | 'industrial' | 'infrastructure' | 'renovation',
    projectLocation: 'Santiago, Chile',
    includeProviders: true,
  });

  // El token getter se configura en DashboardHeader

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      setError('Solo se permiten archivos PDF');
      return;
    }

    const maxSize = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '10485760');
    if (selectedFile.size > maxSize) {
      setError(`El archivo es muy grande. Máximo ${(maxSize / 1024 / 1024).toFixed(0)} MB`);
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResult(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, [handleFileSelect]);

  const handleAnalyze = async () => {
    if (!file) {
      setError('Debe seleccionar un archivo primero');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setProgress({ stage: 'uploading', progress: 0, message: 'Preparando archivo...' });

    try {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('analysisDepth', config.analysisDepth);
      formData.append('projectType', config.projectType);
      formData.append('projectLocation', config.projectLocation);
      formData.append('includeProviders', String(config.includeProviders));

      const progressStages = [
        { stage: 'uploading', progress: 20, message: 'Subiendo archivo...' },
        { stage: 'extracting', progress: 40, message: 'Extrayendo texto...' },
        { stage: 'analyzing', progress: 70, message: 'Analizando con IA...' },
        { stage: 'complete', progress: 100, message: 'Completado' },
      ];

      for (const stage of progressStages) {
        setProgress(stage as PdfAnalysisProgress);
        await new Promise(resolve => setTimeout(resolve, 900));
      }

      const response = await budgetAnalyzerApi.analyzePdf(formData);
      setResult(response);

    } catch (err: any) {
      console.error('Error:', err);
      setError(err.response?.data?.message || 'Error al analizar el archivo');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Análisis de Presupuestos</h1>
        <p className="text-muted-foreground text-lg">
          Sube tu PDF y obtén un análisis detallado
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Subir Archivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-muted'
                  }`}
              >
                {file ? (
                  <div className="space-y-4">
                    <FileText className="w-16 h-16 mx-auto text-primary" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => setFile(null)} disabled={isAnalyzing}>
                      Cambiar Archivo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-16 h-16 mx-auto text-muted-foreground" />
                    <p className="text-lg font-medium">Arrastra tu PDF aquí</p>
                    <Button variant="secondary" asChild>
                      <label className="cursor-pointer">
                        Seleccionar Archivo
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFileSelect(f);
                          }}
                        />
                      </label>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Configuración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Profundidad</label>
                <Select
                  value={config.analysisDepth}
                  onValueChange={(v: any) => setConfig(p => ({ ...p, analysisDepth: v }))}
                  disabled={isAnalyzing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Básico</SelectItem>
                    <SelectItem value="standard">Estándar</SelectItem>
                    <SelectItem value="detailed">Detallado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Proyecto</label>
                <Select
                  value={config.projectType}
                  onValueChange={(v: any) => setConfig(p => ({ ...p, projectType: v }))}
                  disabled={isAnalyzing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residencial</SelectItem>
                    <SelectItem value="commercial">Comercial</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                    <SelectItem value="infrastructure">Infraestructura</SelectItem>
                    <SelectItem value="renovation">Remodelación</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleAnalyze}
            disabled={!file || isAnalyzing}
            className="w-full h-12"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-5 w-5" />
                Analizar
              </>
            )}
          </Button>
        </div>

        <div className="lg:col-span-2">
          {isAnalyzing && progress && (
            <Card>
              <CardHeader>
                <CardTitle>Análisis en Proceso</CardTitle>
                <CardDescription>{progress.message}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={progress.progress} className="h-3" />
                <div className="flex justify-between text-sm">
                  <span>{progress.stage}</span>
                  <span>{progress.progress}%</span>
                </div>
              </CardContent>
            </Card>
          )}

          {result && !isAnalyzing && (
            <Card>
              <CardHeader>
                <CardTitle>Resultados</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
              </CardContent>
            </Card>
          )}

          {!isAnalyzing && !result && (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <CardContent className="text-center">
                <FileText className="w-24 h-24 mx-auto mb-4 opacity-20" />
                <p className="text-lg">Los resultados aparecerán aquí</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
