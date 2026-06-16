'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  Loader2, 
  Building, 
  MapPin, 
  Truck, 
  Award, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  ChevronRight, 
  ExternalLink,
  Plus,
  FileText,
  History,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  Info,
  Calendar,
  Layers
} from 'lucide-react';
import { budgetAnalyzerApi, type CompanyProfile } from '@/lib/api/budgetAnalyzerApi';
import type { AnalysisHistoryItem } from '@/types/budgetAnalysis';
import usageApi from '@/lib/api/usageApi';

type AIRecommendation = {
  type: string;
  title: string;
  score: number;
  rationale: string;
  strategy: string;
};

type AIRiskAssessment = {
  title: string;
  description: string;
  action: string;
};

// Default profile for demonstration if the database profile is not set up
const DEFAULT_PROFILE: CompanyProfile = {
  razon_social: 'Constructora Austral de Chile Ltda.',
  rut_empresa: '77.892.410-5',
  ubicacion_oficinas: 'Valdivia, Región de Los Ríos',
  experiencia_anos: 8,
  num_vehiculos: 5,
  especialidades: ['Pavimentación y bacheo', 'Obras viales (MOP)', 'Mobiliario urbano'],
  fortalezas: 'Equipo en terreno con alta movilidad en la zona sur, flota propia de camiones tolva y rodillos compactadores, excelente relación con proveedores de hormigón y áridos locales.',
  debilidades: 'Sin planta de asfalto propia en caliente, capacidad financiera limitada para boletas de garantía mayores a 200 millones.',
  notas_adicionales: 'Interesados en licitaciones de mejoramiento de aceras y pavimentos en Los Ríos y Los Lagos.'
};

// Client-side rule engine simulating a brief AI analysis of the company
function generateCompanyAiAnalysis(profile: CompanyProfile | null) {
  if (!profile) return null;

  const specs = profile.especialidades || [];
  const location = profile.ubicacion_oficinas || 'Chile';
  const years = profile.experiencia_anos || 0;
  const vehicles = profile.num_vehiculos || 0;
  const strengths = profile.fortalezas || '';
  const weaknesses = profile.debilidades || '';

  const recommendations: AIRecommendation[] = [];

  // 1. Bacheo y Pavimentación
  if (specs.includes('Pavimentación y bacheo') || specs.includes('Obras viales (MOP)')) {
    recommendations.push({
      type: 'vial',
      title: `Conservación Vial y Bacheo Urbano en ${location}`,
      score: years >= 8 ? 94 : 85,
      rationale: `Tu experiencia acumulada de ${years} años y flota de ${vehicles} vehículos son ideales para responder a contratos de bacheo asfáltico en caliente y frío.`,
      strategy: 'Postula a licitaciones de conservación de aceras menores a $180M CLP, donde los requisitos de planta de asfalto propia no sean excluyentes.'
    });
  }

  // 2. Iluminación Pública
  if (specs.includes('Instalaciones eléctricas')) {
    recommendations.push({
      type: 'elec',
      title: `Recambio Tecnológico y Luminarias LED DS43`,
      score: strengths.toLowerCase().includes('electric') || specs.length < 4 ? 90 : 82,
      rationale: `La especialidad eléctrica declarada y tu capacidad en terreno te favorecen para proyectos de recambio masivo a LED en la zona de ${location}.`,
      strategy: 'Prioriza certificar a tus instaladores ante la SEC y valida la compatibilidad con contaminación lumínica (norma DS43).'
    });
  }

  // 3. Obras Civiles y Plazas
  if (specs.includes('Mobiliario urbano') || specs.includes('Paisajismo y áreas verdes') || specs.includes('Edificación pública')) {
    recommendations.push({
      type: 'urb',
      title: 'Habilitación de Espacios Públicos y Plazas Activas',
      score: strengths.toLowerCase().includes('ingeniero') || vehicles > 2 ? 88 : 78,
      rationale: `Tu equipo de trabajo es altamente competitivo para faenas de instalación de escaños, juegos infantiles certificados y pavimentos baldosados municipales.`,
      strategy: 'Focalízate en complementar tu oferta técnica con detalles constructivos de fundaciones hormigón H20 para maximizar puntaje técnico.'
    });
  }

  // Fallback general si no hay coincidencias directas
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'general',
      title: `Contratos Municipales Multidisciplinarios en ${location}`,
      score: 75,
      rationale: `Tu presencia física en ${location} y experiencia en el rubro te permiten competir eficazmente en licitaciones de mantenimiento de infraestructura municipal.`,
      strategy: 'Declara especialidades específicas en tu perfil para refinar este análisis inteligente.'
    });
  }

  // Analizar debilidades para evaluar el riesgo
  const debilidadesLower = weaknesses.toLowerCase();
  const lacksHeavyMachinery = debilidadesLower.includes('maquinaria') || debilidadesLower.includes('camion') || debilidadesLower.includes('planta') || debilidadesLower.includes('árido');
  const lacksExperience = debilidadesLower.includes('experiencia') || debilidadesLower.includes('grande');

  let risk: AIRiskAssessment;

  if (lacksHeavyMachinery) {
    risk = {
      title: 'Riesgo de Margen en Obras Viales Mayores',
      description: 'Tu falta de maquinaria pesada o planta de asfalto propia afectará la rentabilidad en licitaciones de pavimentos de gran volumen frente a competidores integrados.',
      action: 'Subcontrata el arriendo de equipos por hora a proveedores locales y declara convenios notariados en la licitación para asegurar cumplimiento técnico.'
    };
  } else if (lacksExperience) {
    risk = {
      title: 'Limitación de Capacidad Técnica de Bases',
      description: 'Licitaciones complejas de edificación o vialidad MOP exigirán experiencia acumulada de facturación o metros cuadrados construidos que tu empresa aún no declara.',
      action: 'Participa en consorcios temporales (U.T.P. - Unión Temporal de Proveedores) para sumar la experiencia de un socio estratégico.'
    };
  } else {
    risk = {
      title: 'Riesgo de Garantías y Flujo Financiero',
      description: 'Las boletas de garantía por fiel cumplimiento en contratos de más de 6 meses pueden inmovilizar tu capital de trabajo rápidamente.',
      action: 'Negocia pólizas de seguro de garantía en reemplazo de boletas bancarias para liberar cupo financiero y mantener liquidez operativa.'
    };
  }

  return {
    recommendations: recommendations.sort((a, b) => b.score - a.score).slice(0, 2),
    risk
  };
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    const loadData = async () => {
      try {
        const [profileData, historyData, usageData] = await Promise.all([
          budgetAnalyzerApi.getCompanyProfile(),
          budgetAnalyzerApi.getHistory(5, 0),
          usageApi.getBudgetAnalyzerStats()
        ]);

        if (profileData && Object.keys(profileData).length > 0) {
          setProfile(profileData);
        }
        if (historyData?.data?.analyses) {
          setHistory(historyData.data.analyses);
        }
        if (usageData) {
          setUsageStats(usageData);
        }
      } catch (err) {
        console.error('Error cargando información del dashboard:', err);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [user, authLoading]);

  if (authLoading || loadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        <p className="text-slate-500 text-sm font-semibold tracking-wide">Cargando panel de control Licitex...</p>
      </div>
    );
  }

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Empresario';

  const handleOpenProfileModal = () => {
    window.dispatchEvent(new Event('open-profile-form'));
  };

  const handleStatusChange = async (analysisId: string, newStatus: string) => {
    try {
      setHistory(prev => prev.map(item => {
        if (item.analysis_id === analysisId) {
          return {
            ...item,
            metadata: {
              ...(item.metadata || {}),
              bid_status: newStatus
            }
          };
        }
        return item;
      }));
      await budgetAnalyzerApi.updateAnalysis(analysisId, { bid_status: newStatus });
    } catch (err) {
      console.error('Error al actualizar el estado de la licitación:', err);
    }
  };

  const totalAnalyses = history.length;

  // Determine if utilizing the default mock profile
  const isDemoProfile = !profile || !profile.fortalezas;
  const activeProfile = isDemoProfile ? DEFAULT_PROFILE : profile!;
  const aiAnalysis = generateCompanyAiAnalysis(activeProfile);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 px-2 sm:px-4">
      
      {/* Demo Profile Notification Banner */}
      {isDemoProfile && (
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition duration-200">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-200/15 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
          <div className="flex items-start gap-3.5 z-10">
            <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-sm shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-amber-900">Estás visualizando un perfil de demostración</h4>
              <p className="text-xs text-amber-800 leading-relaxed max-w-3xl">
                Para que la IA de <strong>Licitex</strong> calcule las obras públicas que más te favorecen, analice tus debilidades y adapte las justificaciones técnicas de tus APU en tiempo real, configura los datos de tu propia empresa.
              </p>
            </div>
          </div>
          <Button 
            onClick={handleOpenProfileModal}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-amber-600/10 px-5 shrink-0 z-10 self-end sm:self-center transition-all duration-150"
          >
            Configurar mi Empresa
          </Button>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-slate-800/80">
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-gradient-to-br from-blue-500/15 to-indigo-500/0 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full -ml-32 -mb-32 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-xs font-semibold text-blue-400">
              <Sparkles className="w-3.5 h-3.5" />
              Licitaciones y Presupuestos Inteligentes
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Hola, {firstName} 👋
            </h1>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed">
              Analiza presupuestos de obra en minutos. La IA evalúa tus costos unitarios frente a referencias MOP/SERVIU y redacta justificaciones basadas en tu perfil corporativo en <strong>Licitex</strong>.
            </p>
          </div>

          <div className="shrink-0">
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-102 hover:shadow-lg text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 px-6 py-6 transition-all duration-200">
              <Link href="/analyze">
                <Plus className="w-5 h-5 mr-2" />
                Nuevo Análisis
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="border border-slate-100 shadow-sm bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-3xl overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Análisis Totales</p>
              <h3 className="text-2xl font-black text-slate-800">{totalAnalyses}</h3>
              <p className="text-[10px] text-slate-500 font-medium">Procesados en la plataforma</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <FileText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-3xl overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Análisis del Mes</p>
              <h3 className="text-2xl font-black text-slate-800">
                {usageStats?.current_month?.budget_analyses || 0}
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">De tu cupo mensual disponible</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <History className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-3xl overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Especialidades</p>
              <h3 className="text-2xl font-black text-slate-800">
                {activeProfile.especialidades?.length || 0}
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">Especialidades de empresa</p>
            </div>
            <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-3xl overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Ubicación Oficina</p>
              <h3 className="text-base font-extrabold text-slate-850 truncate max-w-[150px]">
                {activeProfile.ubicacion_oficinas || 'Chile'}
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">Oficina y radio de acción</p>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
              <MapPin className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3 width) - Licitex IA Suitability & History */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Licitex IA Suitability Analysis & Bidding Recommendations */}
          <Card className="border border-slate-100 shadow-md overflow-hidden bg-white rounded-3xl">
            <div className="h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-2xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-black text-slate-800">Asesor de Obras e Idoneidad IA (Licitex IA)</CardTitle>
                  <CardDescription className="text-xs">
                    Análisis cruzado de tus capacidades operativas frente al mercado de obras públicas en Chile.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {aiAnalysis ? (
                <div className="space-y-6">
                  {/* Recommendations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aiAnalysis.recommendations.map((rec, idx) => (
                      <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50/90 transition duration-150 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50/80 border border-blue-100 text-[10px] font-black text-blue-700 uppercase tracking-wider">
                              Idoneidad: {rec.score}%
                            </span>
                            <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-0.5">
                              <ShieldCheck className="w-3.5 h-3.5" /> Recomendado
                            </span>
                          </div>
                          <h4 className="text-sm font-extrabold text-slate-800 leading-snug">{rec.title}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed italic">
                            "{rec.rationale}"
                          </p>
                        </div>
                        
                        <div className="pt-3 border-t border-slate-200/60 space-y-1.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Estrategia Licitex IA</span>
                          <p className="text-xs font-semibold text-slate-700 leading-normal">{rec.strategy}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Risk & Mitigation */}
                  <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50/30 flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">{aiAnalysis.risk.title}</h4>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {aiAnalysis.risk.description}
                      </p>
                    </div>
                    <div className="sm:border-l border-rose-200/50 sm:pl-4 pt-2 sm:pt-0 shrink-0 max-w-xs space-y-1">
                      <span className="text-[9px] font-black text-rose-600 uppercase tracking-wider flex items-center gap-1">
                        <Lightbulb className="w-3.5 h-3.5" /> Mitigación Sugerida
                      </span>
                      <p className="text-xs font-bold text-slate-700 leading-snug">
                        {aiAnalysis.risk.action}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Recent Activity / Analysis History */}
          <Card className="border border-slate-100 shadow-md rounded-3xl overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-650" />
                    Análisis Recientes
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Listado de tus últimas estimaciones y estado de confianza de la IA.
                  </CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700 font-semibold gap-1">
                  <Link href="/history">
                    Ver Historial Completo
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {history.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 font-medium">Aún no has realizado análisis de presupuestos.</p>
                  <Button asChild size="sm" className="mt-4 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700">
                    <Link href="/analyze">Crear Primer Análisis</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => {
                    const rawScore = item.confidence_score !== undefined ? item.confidence_score : 0.8;
                    const score = Math.round(rawScore <= 1 ? rawScore * 100 : rawScore);
                    const getBarColor = (scoreValue: number) => {
                      if (scoreValue >= 85) return 'bg-emerald-555';
                      if (scoreValue >= 65) return 'bg-amber-555';
                      return 'bg-rose-555';
                    };

                    return (
                      <div key={item.id} className="p-4 border border-slate-100 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:shadow-xs hover:border-slate-200 transition duration-150 bg-white">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{item.analysis_type}</span>
                            <span className="text-[10px] text-gray-400 font-medium">
                              {new Date(item.created_at).toLocaleDateString('es-CL')}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-800 truncate max-w-[300px]">
                            {item.file_name || `Análisis #${item.id}`}
                          </h4>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <span>{item.location || 'N/A'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 justify-between sm:justify-end shrink-0">
                          {/* Bid Status Selector */}
                          <div className="flex flex-col space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Estado Oferta</span>
                            <select
                              value={item.metadata?.bid_status || 'draft'}
                              onChange={(e) => handleStatusChange(item.analysis_id, e.target.value)}
                              className={`text-[10px] font-black uppercase tracking-wider rounded-xl px-2 py-1 border outline-none cursor-pointer transition-colors duration-150 ${
                                item.metadata?.bid_status === 'applied' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                item.metadata?.bid_status === 'won' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
                                item.metadata?.bid_status === 'lost' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                'bg-slate-50 text-slate-700 border-slate-200'
                              }`}
                            >
                              <option value="draft" className="text-slate-700">Borrador</option>
                              <option value="applied" className="text-blue-700">Postulada</option>
                              <option value="won" className="text-emerald-700">Adjudicada 🏆</option>
                              <option value="lost" className="text-rose-700">Perdida</option>
                            </select>
                          </div>

                          {/* Confidence score */}
                          <div className="space-y-1 min-w-[95px]">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-755 gap-2">
                              <span>Confianza:</span>
                              <span>{score}%</span>
                            </div>
                            <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div className={`h-1.5 rounded-full ${getBarColor(score)}`} style={{ width: `${Math.min(score, 100)}%` }}></div>
                            </div>
                          </div>

                          <Button asChild size="sm" variant="ghost" className="h-8 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 rounded-xl gap-1 shrink-0">
                            <Link href={`/analysis/${item.analysis_id}`}>
                              Detalles
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Column (1/3 width) - Company Profile & Actions */}
        <div className="space-y-6">
          
          {/* Company Profile Details */}
          <Card className="border border-slate-100 shadow-md bg-gradient-to-b from-white to-slate-50/20 rounded-3xl overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-black flex items-center gap-2 text-slate-850">
                  <Building className="w-4.5 h-4.5 text-blue-600" />
                  Perfil de Empresa
                </CardTitle>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border ${
                  isDemoProfile 
                    ? 'bg-amber-50 text-amber-600 border-amber-100' 
                    : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}>
                  {isDemoProfile ? 'Demostración' : 'Real'}
                </span>
              </div>
              <CardDescription className="text-xs">
                Información técnica y operacional cargada en <strong>Licitex</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-5">
              <div className="space-y-4">
                
                {/* Razón Social */}
                <div className="p-3.5 bg-white border border-slate-100 rounded-2xl flex flex-col space-y-1">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                    Razón Social
                  </span>
                  <span className="text-xs font-extrabold text-slate-800 leading-snug">
                    {activeProfile.razon_social || 'No Registrada'}
                  </span>
                  {activeProfile.rut_empresa && (
                    <span className="text-[10px] font-semibold text-slate-500">
                      RUT: {activeProfile.rut_empresa}
                    </span>
                  )}
                </div>

                {/* Location & Experience */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white border border-slate-100 rounded-2xl flex flex-col justify-center space-y-1">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      Ubicación
                    </span>
                    <span className="text-xs font-bold text-slate-800 truncate" title={activeProfile.ubicacion_oficinas}>
                      {activeProfile.ubicacion_oficinas}
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-slate-100 rounded-2xl flex flex-col justify-center space-y-1">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-orange-400" />
                      Experiencia
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {activeProfile.experiencia_anos} años
                    </span>
                  </div>
                </div>

                {/* Vehicles */}
                <div className="p-3 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-emerald-500" />
                    Flota Operativa
                  </span>
                  <span className="text-xs font-extrabold text-slate-800 bg-slate-100 rounded-lg px-2.5 py-1">
                    {activeProfile.num_vehiculos} móviles
                  </span>
                </div>

                {/* Specialties */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Especialidades Técnicas</h4>
                  {activeProfile.especialidades?.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {activeProfile.especialidades.map((spec) => (
                        <span key={spec} className="text-[9px] font-black text-blue-600 bg-blue-50 rounded-lg px-2.5 py-1 border border-blue-100">
                          {spec}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Ninguna especialidad declarada.</p>
                  )}
                </div>

                {/* Strengths */}
                <div className="space-y-1.5 p-3.5 bg-blue-50/30 rounded-2xl border border-blue-100/30">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-500" />
                    Fortalezas de Operación
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    "{activeProfile.fortalezas}"
                  </p>
                </div>

                <Button
                  onClick={handleOpenProfileModal}
                  className="w-full text-xs font-bold bg-slate-900 hover:bg-blue-600 text-white rounded-xl shadow-xs py-2 h-10 transition-all duration-150"
                >
                  Modificar Perfil
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border border-slate-100 shadow-md rounded-3xl overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-400">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-2">
              <Button asChild variant="outline" className="w-full justify-start text-xs font-bold h-10 rounded-xl hover:bg-slate-50/80">
                <Link href="/analyze">
                  <Plus className="w-4 h-4 mr-2.5 text-blue-600" />
                  Subir PDF para Analizar APU
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start text-xs font-bold h-10 rounded-xl hover:bg-slate-50/80">
                <Link href="/history">
                  <History className="w-4 h-4 mr-2.5 text-slate-600" />
                  Ver Historial de Presupuestos
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start text-xs font-bold h-10 rounded-xl hover:bg-slate-50/80">
                <a href={process.env.NEXT_PUBLIC_LANDING_URL || 'https://licitex.cl'} target="_blank" rel="noopener noreferrer" className="flex items-center w-full">
                  <ExternalLink className="w-4 h-4 mr-2.5 text-purple-650" />
                  Ir al Portal Principal Licitex
                </a>
              </Button>
            </CardContent>
          </Card>

        </div>
        
      </div>
    </div>
  );
}
