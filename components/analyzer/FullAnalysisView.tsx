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

  // 🔥 FUNCIÓN ACTUALIZADA: Extrae presupuesto total
  const extractBudget = () => {
    // Prioridad 1: presupuesto_estimado.total_clp (nueva estructura)
    if (analysis.presupuesto_estimado?.total_clp) {
      return analysis.presupuesto_estimado.total_clp;
    }
    
    // Prioridad 2: desglose_costos.total
    if (analysis.desglose_costos?.total) {
      return analysis.desglose_costos.total;
    }
    
    // Fallback: presupuesto_ajustado (estructura antigua)
    if (analysis.presupuesto_ajustado) {
      const match = analysis.presupuesto_ajustado.match(/[\d.,]+/);
      return match ? parseFloat(match[0].replace(/\./g, '').replace(',', '.')) : 0;
    }
    
    return projectInfo.estimated_budget || 0;
  };

  // 🔥 NUEVO: Obtener desglose de costos detallado
  const getDetailedBreakdown = () => {
    // Si existe desglose_costos, usar ese
    if (analysis.desglose_costos) {
      return analysis.desglose_costos;
    }
    
    // Fallback: calcular desde porcentajes
    const total = extractBudget();
    const percentages = analysis.presupuesto_estimado || {};
    
    return {
      materiales: (total * (percentages.materials_percentage || 45)) / 100,
      mano_obra: (total * (percentages.labor_percentage || 35)) / 100,
      equipos: (total * (percentages.equipment_percentage || 10)) / 100,
      gastos_generales: (total * (percentages.overhead_percentage || 10)) / 100,
      total: total
    };
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

          {analysis.cronograma_estimado && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Cronograma Estimado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-line">
                  {analysis.cronograma_estimado}
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
                {/* 🔥 NUEVO: Mostrar desglose desde desglose_costos */}
                {Object.entries(getDetailedBreakdown()).map(([key, value]: [string, any]) => {
                  if (key === 'total' || key === 'subtotal' || key === 'iva') return null;
                  return (
                    <div key={key} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-lg capitalize">
                          {key.replace(/_/g, ' ')}
                        </h4>
                        <span className="text-xl font-bold text-blue-600">
                          {formatCurrency(value)}
                        </span>
                      </div>
                      {analysis.presupuesto_estimado && (
                        <p className="text-sm text-gray-600 mt-1">
                          {((value / extractBudget()) * 100).toFixed(1)}% del total
                        </p>
                      )}
                    </div>
                  );
                })}
                
                {/* Total */}
                <div className="border-t-2 border-gray-200 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold">TOTAL</h3>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatCurrency(extractBudget())}
                    </span>
                  </div>
                </div>
              </div>

              {/* 🔥 NUEVO: Mostrar materiales detallados si existen */}
              {analysis.materiales_detallados && analysis.materiales_detallados.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Materiales Detallados</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left">Material</th>
                          <th className="px-4 py-2 text-left">Cantidad</th>
                          <th className="px-4 py-2 text-left">Unidad</th>
                          <th className="px-4 py-2 text-right">Precio Unit.</th>
                          <th className="px-4 py-2 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysis.materiales_detallados.slice(0, 10).map((item: any, idx: number) => (
                          <tr key={idx} className="border-b">
                            <td className="px-4 py-2">{item.item}</td>
                            <td className="px-4 py-2">{item.cantidad}</td>
                            <td className="px-4 py-2">{item.unidad}</td>
                            <td className="px-4 py-2 text-right">{formatCurrency(item.precio_unitario)}</td>
                            <td className="px-4 py-2 text-right font-semibold">{formatCurrency(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {analysis.materiales_detallados.length > 10 && (
                      <p className="text-sm text-gray-500 mt-2">
                        Mostrando 10 de {analysis.materiales_detallados.length} materiales
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 🔥 NUEVO: Mostrar mano de obra si existe */}
              {analysis.mano_obra && analysis.mano_obra.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Mano de Obra</h3>
                  <div className="space-y-3">
                    {analysis.mano_obra.map((labor: any, idx: number) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{labor.especialidad}</h4>
                            <p className="text-sm text-gray-600">
                              {labor.cantidad_hh || labor.horas_totales} horas × {formatCurrency(labor.tarifa_hora)}/hora
                            </p>
                          </div>
                          <span className="font-bold text-blue-600">
                            {formatCurrency(labor.subtotal)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 🔥 NUEVO: Mostrar equipos si existen */}
              {analysis.equipos_maquinaria && analysis.equipos_maquinaria.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Equipos y Maquinaria</h3>
                  <div className="space-y-3">
                    {analysis.equipos_maquinaria.map((equipo: any, idx: number) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{equipo.equipo || equipo.tipo_equipo}</h4>
                            <p className="text-sm text-gray-600">
                              {equipo.cantidad_dias} días × {formatCurrency(equipo.tarifa_diaria)}/día
                            </p>
                          </div>
                          <span className="font-bold text-blue-600">
                            {formatCurrency(equipo.subtotal)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

              {/* 🔥 NUEVO: Mostrar proveedores si existen */}
              {analysis.proveedores_chile && analysis.proveedores_chile.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Proveedores Recomendados en Chile</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.proveedores_chile.map((proveedor: any, idx: number) => (
                      <div key={idx} className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-900">{proveedor.nombre}</h4>
                        <p className="text-sm text-blue-700">{proveedor.categoria || proveedor.especialidad}</p>
                        {proveedor.ubicacion && (
                          <p className="text-xs text-blue-600 mt-1">📍 {proveedor.ubicacion}</p>
                        )}
                        {proveedor.confiabilidad && (
                          <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                            proveedor.confiabilidad === 'alta' ? 'bg-green-200 text-green-800' :
                            proveedor.confiabilidad === 'media' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-gray-200 text-gray-800'
                          }`}>
                            Confiabilidad: {proveedor.confiabilidad}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                        <h4 className="font-semibold">{riesgo.factor || riesgo.riesgo}</h4>
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            riesgo.probability === 'alta' || riesgo.probabilidad === 'alta' ? 'bg-red-100 text-red-700' :
                            riesgo.probability === 'media' || riesgo.probabilidad === 'media' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            Prob: {riesgo.probability || riesgo.probabilidad}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            riesgo.impact === 'alto' || riesgo.impacto === 'alto' ? 'bg-red-100 text-red-700' :
                            riesgo.impact === 'medio' || riesgo.impacto === 'medio' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            Impacto: {riesgo.impact || riesgo.impacto}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mt-2">
                        <span className="font-medium">Mitigación:</span> {riesgo.mitigation || riesgo.mitigacion}
                      </p>
                    </div>
                  ))
                ) : analysis.factores_riesgo && analysis.factores_riesgo.length > 0 ? (
                  analysis.factores_riesgo.map((riesgo: string, idx: number) => (
                    <div key={idx} className="flex items-start bg-yellow-50 p-3 rounded">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2 mt-1 flex-shrink-0" />
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

          {/* 🔥 NUEVO: Mostrar metadata si existe */}
          {analysis.metadata && (
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-sm">Información del Análisis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {analysis.metadata.model_used && (
                    <div>
                      <span className="text-gray-600">Modelo:</span>
                      <p className="font-medium">{analysis.metadata.model_used}</p>
                    </div>
                  )}
                  {analysis.metadata.confidence_score && (
                    <div>
                      <span className="text-gray-600">Confianza:</span>
                      <p className="font-medium">{analysis.metadata.confidence_score}%</p>
                    </div>
                  )}
                  {analysis.metadata.generated_at && (
                    <div>
                      <span className="text-gray-600">Generado:</span>
                      <p className="font-medium">
                        {new Date(analysis.metadata.generated_at).toLocaleString('es-CL')}
                      </p>
                    </div>
                  )}
                  {analysis.confidence_score && (
                    <div>
                      <span className="text-gray-600">Precisión:</span>
                      <p className="font-medium">{analysis.confidence_score}%</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}