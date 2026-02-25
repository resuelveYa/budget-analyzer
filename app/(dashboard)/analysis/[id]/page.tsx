// app/(dashboard)/analysis/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import FullAnalysisView from '@/components/analyzer/FullAnalysisView';
import DynamicAnalysisView from '@/components/analyzer/DynamicAnalysisView';
import budgetAnalyzerApi from '@/lib/api/budgetAnalyzerApi';
import type { AnalysisHistoryItem } from '@/types/budgetAnalysis';

export default function AnalysisDetailPage() {
  const params = useParams();
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = params.id as string;
    loadAnalysisData(id);
  }, [params.id]);

  const loadAnalysisData = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Buscando análisis con ID:', id);

      // ESTRATEGIA 1: localStorage (más rápido y confiable)
      const stored = localStorage.getItem(id);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          console.log('✅ Análisis encontrado en localStorage:', data);

          // Verificar que tenga la estructura correcta
          if (data.data?.analysis || data.analysis) {
            setAnalysisData(data);
            setIsLoading(false);
            return;
          }
        } catch (parseError) {
          console.warn('⚠️ Error parseando localStorage, continuando con backend...');
        }
      }

      // ESTRATEGIA 2: Buscar en backend
      console.log('🔍 No encontrado en localStorage, buscando en backend...');
      try {
        const found = await budgetAnalyzerApi.getById(id);

        if (found) {
          console.log('✅ Análisis encontrado en backend:', found);

          // Si el análisis tiene toda la data en details, úsala
          if (found.details && Object.keys(found.details).length > 0) {
            const formattedData = {
              data: {
                analysis: {
                  resumen_ejecutivo: found.summary || found.details.resumen_ejecutivo || 'No disponible',
                  presupuesto_estimado: found.details.presupuesto_estimado || {
                    total_clp: found.estimated_budget || 0
                  },
                  desglose_costos: found.details.desglose_costos || null,
                  confidence_score: found.confidence_score || 0,
                  analisis_riesgos: found.details.analisis_riesgos || [],
                  recomendaciones: found.details.recomendaciones || [],
                  factores_regionales: found.details.factores_regionales || {},
                  materiales_detallados: found.details.materiales_detallados || [],
                  mano_obra: found.details.mano_obra || [],
                  equipos_maquinaria: found.details.equipos_maquinaria || [],
                  proveedores_chile: found.details.proveedores_chile || [],
                  cronograma_estimado: found.details.cronograma_estimado || '',
                  contingencia_recomendada: found.details.contingencia_recomendada || '20%',
                  ...found.details
                },
                project_info: {
                  location: found.location || 'No especificada',
                  project_type: found.project_type || 'No especificado',
                  file_name: found.file_name || 'Sin nombre',
                  estimated_budget: found.estimated_budget || 0,
                  area_m2: found.area_m2,
                  type: found.project_type
                },
                analysis_id: found.analysis_id
              }
            };

            setAnalysisData(formattedData);

            // Guardar en localStorage para futuros accesos
            localStorage.setItem(id, JSON.stringify(formattedData));
          } else {
            // Si no tiene details completo o is already well formulated
            const formattedData = {
              data: found.data ? found.data : {
                analysis: {
                  resumen_ejecutivo: found.summary || found.resumen_ejecutivo || 'Este análisis no tiene información detallada disponible.',
                  presupuesto_estimado: found.presupuesto_estimado || {
                    total_clp: found.estimated_budget || 0
                  },
                  confidence_score: found.confidence_score || found.metadata?.confidence_score || 0,
                  ...found
                },
                project_info: {
                  location: found.location || 'No especificada',
                  project_type: found.project_type || 'No especificado',
                  file_name: found.file_name || 'Sin nombre',
                  estimated_budget: found.estimated_budget || 0,
                  area_m2: found.area_m2
                },
                analysis_id: found.analysis_id
              }
            };

            setAnalysisData(formattedData);
            localStorage.setItem(id, JSON.stringify(formattedData));
          }
        } else {
          setError('Análisis no encontrado en el historial');
        }
      } catch (backendErr: any) {
        console.error('❌ Error cargando análisis del servidor:', backendErr);
        setError('Error cargando análisis del servidor');
      }

    } catch (err: any) {
      console.error('❌ Error cargando análisis:', err);
      setError(err.message || 'Error cargando el análisis');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/history">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Link>
        </Button>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-muted-foreground">Cargando análisis...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analysisData) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/history">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Link>
        </Button>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="text-red-500 mb-4 text-5xl">⚠️</div>
            <h2 className="text-2xl font-bold mb-2">
              {error || 'Análisis no encontrado'}
            </h2>
            <p className="text-muted-foreground mb-6">
              No se pudo cargar la información del análisis solicitado.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" asChild>
                <Link href="/history">Ver historial</Link>
              </Button>
              <Button asChild>
                <Link href="/analyze">Nuevo análisis</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // Detectar tipo de análisis: PDF vs manual/quick
  const isPdfAnalysis = () => {
    const analysisId = analysisData?.data?.analysis_id || '';
    const analysisType = analysisData?.analysis_type || analysisData?.data?.analysis_type;

    // Detectar por ID (project_*) o por tipo explícito
    return analysisId.startsWith('project_') || analysisType === 'pdf';
  };

  // Renderizar vista apropiada según tipo de análisis
  if (isPdfAnalysis()) {
    return <DynamicAnalysisView analysis={analysisData} />;
  }

  return <FullAnalysisView analysis={analysisData} />;
}