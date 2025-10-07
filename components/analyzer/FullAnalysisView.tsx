'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, TrendingUp, AlertTriangle, MapPin, Calendar, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface FullAnalysisViewProps {
  analysisData: any;
}

export default function FullAnalysisView({ analysisData }: FullAnalysisViewProps) {
  const router = useRouter();
  const analysis = analysisData?.data?.analysis || {};
  const projectInfo = analysisData?.data?.project_info || {};

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const extractBudget = () => {
    if (analysis.presupuesto_ajustado) {
      const match = analysis.presupuesto_ajustado.match(/[\d.,]+/);
      return match ? parseFloat(match[0].replace(/\./g, '').replace(',', '.')) : 0;
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            ← Volver
          </Button>
          <h1 className="text-4xl font-bold mb-2">Análisis Presupuestario Completo</h1>
          <div className="flex items-center space-x-4 text-muted-foreground">
            <span className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {projectInfo.location || 'No especificado'}
            </span>
            <span>{projectInfo.area ? `${projectInfo.area}m²` : ''}</span>
            <span className="capitalize">{projectInfo.type || ''}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Presupuesto Total */}
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-blue-100 text-sm mb-2">Presupuesto Total Estimado</p>
            <p className="text-6xl font-bold mb-4">
              {formatCurrency(extractBudget())}
            </p>
            <p className="text-blue-100">
              Basado en análisis con IA y datos de mercado actuales
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de contenido */}
      <Tabs defaultValue="resumen" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="desglose">Desglose</TabsTrigger>
          <TabsTrigger value="factores">Factores</TabsTrigger>
          <TabsTrigger value="riesgos">Riesgos</TabsTrigger>
          <TabsTrigger value="recomendaciones">Recomendaciones</TabsTrigger>
        </TabsList>

        {/* Tab Resumen */}
        <TabsContent value="resumen" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Resumen Ejecutivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                {analysis.resumen_ejecutivo || 'No disponible'}
              </p>
            </CardContent>
          </Card>

          {analysis.cronograma_sugerido && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Cronograma Sugerido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-line">
                  {analysis.cronograma_sugerido}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Desglose */}
        <TabsContent value="desglose" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Desglose Detallado de Costos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.desglose_detallado && Object.entries(analysis.desglose_detallado).map(([key, value]: [string, any]) => (
                  <div key={key} className="border-l-4 border-blue-500 pl-4 py-2">
                    <h4 className="font-semibold text-lg capitalize mb-2">
                      {key.replace(/_/g, ' ')}
                    </h4>
                    {value?.porcentaje && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Porcentaje:</span> {value.porcentaje}
                      </p>
                    )}
                    {value?.monto && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Monto:</span> {value.monto}
                      </p>
                    )}
                    {value?.observaciones && (
                      <p className="text-sm text-gray-700 mt-2">
                        {value.observaciones}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Factores Regionales */}
        <TabsContent value="factores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Factores Regionales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.factores_regionales && Object.entries(analysis.factores_regionales).map(([key, value]: [string, any]) => (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold capitalize mb-2">
                      {key.replace(/_/g, ' ')}
                    </h4>
                    <p className="text-sm text-gray-700">{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Riesgos */}
        <TabsContent value="riesgos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
                Análisis de Riesgos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.analisis_riesgos && analysis.analisis_riesgos.length > 0 ? (
                  analysis.analisis_riesgos.map((riesgo: any, idx: number) => (
                    <div key={idx} className="border-l-4 border-yellow-400 bg-yellow-50 p-4 rounded-r-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{riesgo.riesgo}</h4>
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            riesgo.probabilidad === 'alta' ? 'bg-red-100 text-red-700' :
                            riesgo.probabilidad === 'media' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            Prob: {riesgo.probabilidad}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            riesgo.impacto === 'alto' ? 'bg-red-100 text-red-700' :
                            riesgo.impacto === 'medio' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            Impacto: {riesgo.impacto}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mt-2">
                        <span className="font-medium">Mitigación:</span> {riesgo.mitigacion}
                      </p>
                    </div>
                  ))
                ) : analysis.factores_riesgo && analysis.factores_riesgo.length > 0 ? (
                  analysis.factores_riesgo.map((riesgo: string, idx: number) => (
                    <div key={idx} className="flex items-start bg-yellow-50 p-3 rounded">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2 mt-1" />
                      <span className="text-sm text-gray-700">{riesgo}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No se identificaron riesgos específicos</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Recomendaciones */}
        <TabsContent value="recomendaciones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Recomendaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {analysis.recomendaciones && analysis.recomendaciones.length > 0 ? (
                  analysis.recomendaciones.map((rec: string, idx: number) => (
                    <li key={idx} className="flex items-start">
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mt-2 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-gray-500">No hay recomendaciones específicas</p>
                )}
              </ul>
            </CardContent>
          </Card>

          {analysis.contingencia_recomendada && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <h4 className="font-semibold text-blue-900 mb-2">
                  Contingencia Recomendada
                </h4>
                <p className="text-blue-800">{analysis.contingencia_recomendada}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
