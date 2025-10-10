'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileText, Loader2 } from 'lucide-react';
import { analyzeApi } from '@/lib/api/client';

interface AnalysisItem {
  id: number;
  analysis_id: string;
  created_at: string;
  analysis_type: 'quick' | 'pdf' | 'project';
  project_type?: string;
  location?: string;
  estimated_budget?: number;
  confidence_score?: number;
  summary?: string;
  file_name?: string;
}

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Cargando historial...');
      const response = await analyzeApi.getHistory(20);
      
      console.log('📦 Respuesta recibida:', response);
      
      if (response && response.success && response.data) {
        setAnalyses(response.data.analyses || []);
        console.log('✅ Análisis cargados:', response.data.analyses.length);
      } else {
        console.log('⚠️ Respuesta sin datos');
        setAnalyses([]);
      }
    } catch (err: any) {
      console.error('❌ Error cargando historial:', err);
      setError(err.message || 'Error cargando el historial');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getAnalysisTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      quick: 'Análisis Rápido',
      pdf: 'Análisis PDF',
      project: 'Proyecto'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Historial de Análisis</h1>
            <p className="text-xl text-muted-foreground">
              Revisa tus análisis anteriores
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-gray-300 animate-spin" />
            <p className="text-muted-foreground">Cargando historial...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Historial de Análisis</h1>
            <p className="text-xl text-muted-foreground">
              Revisa tus análisis anteriores
            </p>
          </div>
          <Button asChild>
            <Link href="/analyze">
              <FileText className="w-5 h-5 mr-2" />
              Nuevo Análisis
            </Link>
          </Button>
        </div>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-12 text-center">
            <div className="text-red-500 mb-4 text-4xl">⚠️</div>
            <h3 className="text-lg font-semibold mb-2 text-red-900">
              Error cargando historial
            </h3>
            <p className="text-red-700 mb-6">{error}</p>
            <Button onClick={loadHistory} variant="outline">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Historial de Análisis</h1>
            <p className="text-xl text-muted-foreground">
              Revisa tus análisis anteriores
            </p>
          </div>
          <Button asChild>
            <Link href="/analyze">
              <FileText className="w-5 h-5 mr-2" />
              Nuevo Análisis
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2">No hay análisis</h3>
            <p className="text-muted-foreground mb-6">
              Aún no has realizado ningún análisis
            </p>
            <Button asChild>
              <Link href="/analyze">Crear primer análisis</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Historial de Análisis</h1>
          <p className="text-xl text-muted-foreground">
            {analyses.length} análisis realizados
          </p>
        </div>
        <Button asChild>
          <Link href="/analyze">
            <FileText className="w-5 h-5 mr-2" />
            Nuevo Análisis
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {analyses.map((analysis) => (
          <Card key={analysis.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {getAnalysisTypeLabel(analysis.analysis_type)}
                    </span>
                    
                    {analysis.confidence_score && (
                      <span className="text-sm text-muted-foreground">
                        {analysis.confidence_score}% confianza
                      </span>
                    )}
                    
                    <span className="text-sm text-muted-foreground">
                      {formatDate(analysis.created_at)}
                    </span>
                  </div>

                  {analysis.file_name && (
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{analysis.file_name}</span>
                    </div>
                  )}

                  <h3 className="text-lg font-semibold mb-2">
                    {analysis.project_type || 'Análisis de Presupuesto'}
                    {analysis.location && (
                      <span className="text-muted-foreground font-normal text-base ml-2">
                        • {analysis.location}
                      </span>
                    )}
                  </h3>

                  {analysis.summary && (
                    <p className="text-muted-foreground mb-3 line-clamp-2">
                      {analysis.summary}
                    </p>
                  )}

                  {analysis.estimated_budget && analysis.estimated_budget > 0 && (
                    <div className="text-lg font-bold text-primary">
                      {formatCurrency(analysis.estimated_budget)}
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  <Button asChild variant="outline">
                    <Link href={`/analysis/${analysis.analysis_id}`}>
                      Ver Detalles
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {analyses.length >= 20 && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            Mostrando los últimos 20 análisis
          </p>
        </div>
      )}
    </div>
  );
}