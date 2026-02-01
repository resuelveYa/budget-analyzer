'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText, MapPin, DollarSign, AlertTriangle, Users,
  Ruler, Download, ChevronDown, ChevronUp, Route, Settings2,
  ArrowLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PdfProjectAnalysisViewProps {
  analysis: any;
}

export default function PdfProjectAnalysisView({ analysis: analysisProp }: PdfProjectAnalysisViewProps) {
  const router = useRouter();
  const [expandedDoc, setExpandedDoc] = useState<number | null>(0);

  // Normalizar datos
  const data = analysisProp?.data || analysisProp || {};
  const analysis = data.analysis || data;
  const projectInfo = data.project_info || analysis.project_info || {};

  // Extraer campos consolidados
  const tramos = analysis.tramos_camino || [];
  const cubicaciones = analysis.cubicaciones || [];
  const normativas = analysis.normativas_aplicables || {};
  const especificaciones = analysis.especificaciones_tecnicas || [];
  const comunidades = analysis.comunidades_indigenas || [];
  const archivos = analysis.archivos_analizados || analysis.archivos || [];
  const itemsPresupuesto = analysis.items_presupuesto || [];

  const formatCurrency = (amount: number) => {
    if (!amount || isNaN(amount)) return '$0';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const extractBudget = () => {
    return analysis.presupuesto_estimado?.total_clp
      || analysis.resumen_consolidado?.total_con_iva
      || projectInfo.estimated_budget
      || 0;
  };

  return (
    <div className="space-y-6">
      {/* Back button + Header */}
      <div className="flex justify-between items-start">
        <div>
          <Button variant="ghost" onClick={() => router.back()} className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            {projectInfo.name || 'Proyecto MOP'}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-gray-600">
            <span className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {projectInfo.location || 'Chile'}
            </span>
            {projectInfo.longitud_total_km > 0 && (
              <span className="flex items-center">
                <Route className="w-4 h-4 mr-1" />
                {projectInfo.longitud_total_km} km totales
              </span>
            )}
            {projectInfo.total_tramos > 0 && (
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-sm">
                {projectInfo.total_tramos} tramos
              </span>
            )}
            {projectInfo.total_comunidades > 0 && (
              <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-sm">
                {projectInfo.total_comunidades} comunidades
              </span>
            )}
          </div>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* Presupuesto Total Card */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-blue-100 text-sm mb-1">Presupuesto Total Estimado</p>
            <p className="text-5xl font-bold mb-2">{formatCurrency(extractBudget())}</p>
            <div className="flex justify-center gap-8 text-blue-100 text-sm">
              <span>Neto: {formatCurrency(analysis.presupuesto_estimado?.neto_clp || 0)}</span>
              <span>IVA: {formatCurrency(analysis.presupuesto_estimado?.iva_clp || 0)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <FileText className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{archivos.length}</p>
            <p className="text-sm text-gray-500">Documentos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Route className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{tramos.length}</p>
            <p className="text-sm text-gray-500">Tramos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Ruler className="w-8 h-8 mx-auto mb-2 text-orange-500" />
            <p className="text-2xl font-bold">{cubicaciones.length}</p>
            <p className="text-sm text-gray-500">Cubicaciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">{comunidades.length}</p>
            <p className="text-sm text-gray-500">Comunidades</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="resumen" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6 lg:grid-cols-6">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="tramos">Tramos</TabsTrigger>
          <TabsTrigger value="cubicaciones">Cubicaciones</TabsTrigger>
          <TabsTrigger value="normativas">Normativas</TabsTrigger>
          <TabsTrigger value="comunidades">Comunidades</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>

        {/* Tab: Resumen */}
        <TabsContent value="resumen" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumen Ejecutivo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                {analysis.resumen_ejecutivo || analysis.resumen_consolidado?.resumen_ejecutivo || 'Análisis en proceso...'}
              </p>
            </CardContent>
          </Card>

          {/* Specs Técnicos rápidos */}
          {especificaciones.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings2 className="w-5 h-5 mr-2" />
                  Especificaciones Técnicas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {especificaciones.slice(0, 4).map((spec: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900">{spec.nombre}</h4>
                      <p className="text-sm text-gray-600 mt-1">{spec.descripcion}</p>
                      {spec.materiales?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {spec.materiales.map((m: string, i: number) => (
                            <span key={i} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">
                              {m}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Tramos */}
        <TabsContent value="tramos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Route className="w-5 h-5 mr-2" />
                Tramos de Camino ({tramos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tramos.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left">Camino</th>
                        <th className="px-4 py-3 text-left">Comunidad</th>
                        <th className="px-4 py-3 text-right">KM Inicio</th>
                        <th className="px-4 py-3 text-right">KM Término</th>
                        <th className="px-4 py-3 text-right">Longitud (m)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {tramos.map((tramo: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono">{tramo.camino_id || '-'}</td>
                          <td className="px-4 py-3">{tramo.comunidad || '-'}</td>
                          <td className="px-4 py-3 text-right">{tramo.km_inicio ?? '-'}</td>
                          <td className="px-4 py-3 text-right">{tramo.km_termino ?? '-'}</td>
                          <td className="px-4 py-3 text-right font-semibold">{tramo.longitud_m ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No se encontraron tramos de camino en los documentos.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Cubicaciones */}
        <TabsContent value="cubicaciones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Ruler className="w-5 h-5 mr-2" />
                Cubicaciones ({cubicaciones.length} items)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cubicaciones.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left">Código</th>
                        <th className="px-4 py-3 text-left">Descripción</th>
                        <th className="px-4 py-3 text-right">Cantidad</th>
                        <th className="px-4 py-3 text-center">Unidad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {cubicaciones.map((cub: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-blue-600">{cub.codigo_item || '-'}</td>
                          <td className="px-4 py-3">{cub.descripcion || '-'}</td>
                          <td className="px-4 py-3 text-right font-semibold">{cub.cantidad?.toLocaleString('es-CL') ?? '-'}</td>
                          <td className="px-4 py-3 text-center">{cub.unidad || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No se encontraron cubicaciones en los documentos.</p>
              )}
            </CardContent>
          </Card>

          {/* Items de Presupuesto */}
          {itemsPresupuesto.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Items de Presupuesto ({itemsPresupuesto.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left">Código</th>
                        <th className="px-4 py-3 text-left">Descripción</th>
                        <th className="px-4 py-3 text-right">Cantidad</th>
                        <th className="px-4 py-3 text-center">Unidad</th>
                        <th className="px-4 py-3 text-right">P. Unitario</th>
                        <th className="px-4 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {itemsPresupuesto.slice(0, 20).map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-blue-600">{item.codigo || '-'}</td>
                          <td className="px-4 py-3">{item.descripcion || '-'}</td>
                          <td className="px-4 py-3 text-right">{item.cantidad?.toLocaleString('es-CL') ?? '-'}</td>
                          <td className="px-4 py-3 text-center text-gray-500">{item.unidad || '-'}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(item.precio_unitario)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-green-600">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {itemsPresupuesto.length > 20 && (
                    <p className="text-center text-gray-500 text-sm mt-4">
                      Mostrando 20 de {itemsPresupuesto.length} items
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Normativas */}
        <TabsContent value="normativas" className="space-y-4">
          {/* Vallas Camineras */}
          {normativas.vallas_camineras && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
                  Vallas Camineras MOP
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Tipo de Valla</p>
                      <p className="text-2xl font-bold text-yellow-700">
                        Tipo {normativas.vallas_camineras.tipo || 'A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Dimensiones</p>
                      <p className="text-xl font-semibold">
                        {normativas.vallas_camineras.dimensiones || '6.0 x 2.5 mt'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Especificaciones</p>
                      <p className="text-sm text-gray-700">
                        {normativas.vallas_camineras.especificaciones || 'Ver documentos'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Señalización y Seguridad */}
          <div className="grid md:grid-cols-2 gap-4">
            {normativas.senalizacion?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Señalización Vial</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {normativas.senalizacion.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {normativas.seguridad?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Seguridad Laboral</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {normativas.seguridad.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-orange-500 mr-2">•</span>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {!normativas.vallas_camineras && normativas.senalizacion?.length === 0 && normativas.seguridad?.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No se encontraron normativas específicas en los documentos analizados.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Comunidades */}
        <TabsContent value="comunidades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Comunidades Indígenas ({comunidades.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {comunidades.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {comunidades.map((com: any, idx: number) => (
                    <div key={idx} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-900">{com.nombre}</h4>
                      {com.ubicacion && (
                        <p className="text-sm text-purple-700 flex items-center mt-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          {com.ubicacion}
                        </p>
                      )}
                      {com.requisitos_participacion?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-purple-600 font-medium">Requisitos:</p>
                          <ul className="text-sm text-gray-700 mt-1">
                            {com.requisitos_participacion.map((req: string, i: number) => (
                              <li key={i} className="flex items-start">
                                <span className="text-purple-400 mr-1">-</span>
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No se encontraron comunidades indígenas en los documentos.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Documentos */}
        <TabsContent value="documentos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Documentos Analizados ({archivos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {archivos.length > 0 ? (
                <div className="space-y-3">
                  {archivos.map((doc: any, idx: number) => (
                    <div key={idx} className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedDoc(expandedDoc === idx ? null : idx)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 mr-3 text-blue-500" />
                          <div className="text-left">
                            <p className="font-semibold">{doc.metadata?.filename || `Documento ${idx + 1}`}</p>
                            <p className="text-sm text-gray-500 capitalize">{doc.documento?.tipo || 'Documento'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {doc.presupuesto?.tiene_datos_presupuestarios && (
                            <span className="text-green-600 font-semibold">
                              {formatCurrency(doc.presupuesto.total_con_iva)}
                            </span>
                          )}
                          {expandedDoc === idx ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </button>

                      {expandedDoc === idx && (
                        <div className="p-4 border-t bg-white">
                          {doc.documento?.resumen && (
                            <p className="text-gray-700 mb-4">{doc.documento.resumen}</p>
                          )}
                          {doc.documento?.puntos_clave?.length > 0 && (
                            <div>
                              <p className="font-medium text-gray-700 mb-2">Puntos Clave:</p>
                              <ul className="space-y-1">
                                {doc.documento.puntos_clave.map((punto: string, i: number) => (
                                  <li key={i} className="flex items-start text-sm">
                                    <span className="text-blue-500 mr-2">•</span>
                                    <span>{punto}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No hay documentos para mostrar.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
