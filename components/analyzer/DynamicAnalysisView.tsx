'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { GeneralExpensesView } from './GeneralExpensesView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText, MapPin, DollarSign, Users, Package, Truck, Clock, Ruler,
  Download, ChevronDown, ChevronUp, Settings2, AlertTriangle, ArrowLeft,
  Shield, Building, ClipboardList, Briefcase, BookOpen, AlertCircle,
  HardHat, FileCheck, Loader2, FileSpreadsheet, FileDown, Search, TrendingUp, Save, Plus, Trash2, Calendar
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { budgetAnalyzerApi } from '@/lib/api/budgetAnalyzerApi';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface DynamicAnalysisViewProps {
  analysis: any;
}

// --- Sub-component for APU Item Row to prevent full page re-renders ---
const ApuItemRow = memo(({ 
  item, 
  onUpdate, 
  onRemove, 
  formatCurrency,
  resourceList = []
}: { 
  item: any, 
  onUpdate: (field: string, value: any) => void, 
  onRemove: () => void,
  formatCurrency: (val: number) => string,
  resourceList?: string[]
}) => {
  const [localValues, setLocalValues] = useState({
    descripcion: item.descripcion || item.nombre || '',
    unidad: item.unidad || '',
    cantidad: item.cantidad ?? '',
    precio_unitario: item.precio_unitario || item.unit_price || ''
  });

  const datalistId = useMemo(() => `res-${Math.random().toString(36).substring(7)}`, []);

  // Sync local state if external item changes
  useEffect(() => {
    setLocalValues({
      descripcion: item.descripcion || item.nombre || '',
      unidad: item.unidad || '',
      cantidad: item.cantidad ?? '',
      precio_unitario: item.precio_unitario || item.unit_price || ''
    });
  }, [item.descripcion, item.nombre, item.unidad, item.cantidad, item.precio_unitario, item.unit_price]);

  // Ref for debouncing
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = (field: string, value: any) => {
    setLocalValues(prev => ({ ...prev, [field]: value }));
    
    // Debounce the update to parent
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onUpdate(field, value);
    }, 400);
  };

  const handleBlur = (field: string, value: any) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onUpdate(field, value);
  };

  const rowTotal = (parseFloat(localValues.cantidad as string) || 0) * (parseFloat(localValues.precio_unitario as string) || 0);
  const unit = (localValues.unidad || '').toLowerCase();
  const isMonth = unit.includes('mes');
  
  // Specialized detection
  const descLower = localValues.descripcion.toLowerCase();
  const isInstalacionFaena = descLower.includes('instalacion de faena') || descLower.includes('instalación de faena');
  const isExcavacion = descLower.includes('excavacion') || descLower.includes('excavación');

  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/30 transition-colors group/row">
      <td className="py-1 px-2 text-[9px]">
        <div className="relative group">
          <input 
            type="text"
            list={datalistId}
            value={localValues.descripcion}
            onChange={(e) => handleChange('descripcion', e.target.value)}
            onBlur={(e) => handleBlur('descripcion', e.target.value)}
            placeholder="Descripción..."
            className="w-full bg-transparent hover:bg-white focus:bg-white border-none focus:ring-1 focus:ring-blue-300 rounded p-0.5 transition-all text-[9.5px] font-medium text-slate-800"
          />
          <datalist id={datalistId}>
            {resourceList.map((res: string, idx: number) => (
              <option key={idx} value={res} />
            ))}
          </datalist>
          
          {/* Specialized Helpers */}
          {isInstalacionFaena && !isMonth && (
            <span className="absolute -top-4 left-0 text-[7px] font-bold text-amber-600 bg-amber-50 px-1 rounded border border-amber-100 animate-pulse">
              Tip: ¿Cambiar a meses?
            </span>
          )}
        </div>
      </td>
      <td className="py-1 px-2 text-[9px] text-center">
        <input 
          type="text"
          value={localValues.unidad}
          onChange={(e) => handleChange('unidad', e.target.value)}
          onBlur={(e) => handleBlur('unidad', e.target.value)}
          placeholder="Und"
          className="w-10 text-center bg-transparent hover:bg-white focus:bg-white border-none focus:ring-1 focus:ring-blue-300 rounded p-0.5 transition-all text-[9.5px] text-slate-600 font-bold"
        />
      </td>
      <td className="py-1 px-2 text-[9px] text-center">
        <input 
          type="number"
          step={isMonth ? "1" : "0.01"}
          value={localValues.cantidad}
          onChange={(e) => handleChange('cantidad', e.target.value)}
          onBlur={(e) => handleBlur('cantidad', e.target.value)}
          className="w-14 text-center bg-transparent hover:bg-white focus:bg-white border-none focus:ring-1 focus:ring-blue-300 rounded p-0.5 transition-all text-[9.5px] font-bold text-slate-700"
        />
      </td>
      <td className="py-1 px-2 text-[9px] text-right tabular-nums">
        <input 
          type="number"
          value={localValues.precio_unitario}
          onChange={(e) => handleChange('precio_unitario', e.target.value)}
          onBlur={(e) => handleBlur('precio_unitario', e.target.value)}
          className="w-20 text-right bg-transparent hover:bg-white focus:bg-white border-none focus:ring-1 focus:ring-blue-300 rounded p-0.5 transition-all text-[9.5px] font-bold text-slate-700"
        />
      </td>
      <td className="py-1 px-2 text-[9px] text-slate-800 font-black text-right tabular-nums">
        {formatCurrency(rowTotal).replace('$', '').trim()}
      </td>
      <td className="py-1 px-2 text-center">
        <div className="flex items-center gap-1 justify-center">
          {isExcavacion && (
            <button 
              className="text-blue-400 hover:text-blue-600 transition-colors opacity-0 group-hover/row:opacity-100"
              title="Añadir retiro de material"
              onClick={() => {
                // This would be handled by a more complex event, but for now just visual
                toast.info("Añadiendo retiro de excedentes...");
              }}
            >
              <Truck className="w-3 h-3" />
            </button>
          )}
          <button 
            onClick={onRemove}
            className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover/row:opacity-100"
            title="Eliminar fila"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </td>
    </tr>
  );
});

export default function DynamicAnalysisView({ analysis: analysisProp }: { analysis: any }) {
  const router = useRouter();
  const [expandedDoc, setExpandedDoc] = useState<number | null>(0);
  const [margin, setMargin] = useState<number>(0); // Margen global sobre el referencial (%)
  const [itemMargins, setItemMargins] = useState<Record<number, number>>({});
  const [isExporting, setIsExporting] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [tabsPinned, setTabsPinned] = useState(false);
  const lastScrollY = useRef(0);
  const tabsSentinelRef = useRef<HTMLDivElement>(null);

  // Observe when the tabs leave their natural position
  useEffect(() => {
    const sentinel = tabsSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setTabsPinned(!entry.isIntersecting);
        if (entry.isIntersecting) {
          // Back near the top — always show
          setHeaderVisible(true);
        }
      },
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Scroll-direction hide/show only when tabs are pinned (past their natural pos)
  useEffect(() => {
    if (!tabsPinned) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY.current) {
        setHeaderVisible(true);  // scrolling up
      } else if (currentScrollY > lastScrollY.current) {
        setHeaderVisible(false); // scrolling down
      }
      lastScrollY.current = currentScrollY;
    };

    lastScrollY.current = window.scrollY;
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tabsPinned]);

  // --- NORMALIZACIÓN ROBUSTA DE DATOS ---
  const data = analysisProp?.data || analysisProp || {};

  // Buscamos el objeto "core" que contiene el análisis real (APUs, items, etc.)
  // Intentamos profundizar hasta encontrar apu_data o items_presupuesto
  const getAnalysisCore = (obj: any): any => {
    if (!obj) return {};
    if (obj.full_analysis) return getAnalysisCore(obj.full_analysis);
    if (obj.analysis) return getAnalysisCore(obj.analysis);
    if (obj.details) return getAnalysisCore(obj.details);
    return obj;
  };

  const analysis = getAnalysisCore(data);

  // Extraemos info de proyecto priorizando la raíz pero buscando en el core como fallback
  const projectInfo = data.project_info || analysis.project_info || {};
  const proyecto = data.proyecto || analysis.proyecto || {};

  // Helper para renderizar valores de forma segura (evitar Error: Objects are not valid as a React child)
  const safeRender = (val: any) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') {
      // Si es un objeto, intentar extraer campos comunes o stringify como último recurso
      return val.descripcion || val.nombre || val.titulo || val.texto || val.value || JSON.stringify(val);
    }
    return String(val);
  };

  // === CAMPOS UNIVERSALES ===
  const materiales = analysis.materiales || [];
  const manoObra = analysis.mano_obra || [];
  const maquinaria = analysis.maquinaria || [];
  const equipamientoObra = analysis.equipamiento_obra || [];
  const sectionsPresupuesto: any[] = analysis.secciones_presupuesto || [];
  const gastosGeneralesData = analysis.gastos_generales_data || null;

  // === PROFESIONALES Y REQUISITOS ===
  const profesionalesRequeridos = analysis.profesionales_requeridos || [];
  const requisitosTecnicos = analysis.requisitos_tecnicos || [];
  const documentosRequeridos = analysis.documentos_requeridos || [];
  const garantias = analysis.garantias || [];

  // === ESPECIFICACIONES ===
  const especificacionesTecnicas = analysis.especificaciones_tecnicas || [];
  const senaletica = analysis.senaletica || [];
  const seguridadObra = analysis.seguridad_obra || [];

  // === NORMATIVAS ===
  const normativas = analysis.normativas || [];
  const riesgos = analysis.riesgos || [];
  const condicionesEspeciales = analysis.condiciones_especiales || [];

  // === PLAZOS ===
  const plazos = analysis.plazos || {};
  // Aseguramos que apu_data sea un array y filtramos posibles nulos
  const initialApuData = (analysis.apu_data || []).filter((a: any) => a !== null);

  // === DOCUMENTOS ===
  const documentosInfo = analysis.documentos_info || [];
  const archivos = analysis.archivos || [];

  // === CAMPOS ESPECÍFICOS ===
  const tramos = analysis.tramos_camino || [];
  const cubicaciones = analysis.cubicaciones || [];
  const comunidades = analysis.comunidades_indigenas || analysis.comunidades || [];
  const consideracionesIndigenas = analysis.consideraciones_indigenas || {};
  const participacionCiudadana = useMemo(() => analysis.participacion_ciudadana || [], [analysis.participacion_ciudadana]);
  const analisisEstrategico = useMemo(() => analysis.analisis_estrategico || {}, [analysis.analisis_estrategico]);
  
  // === EDITABLE APU STATE ===
  const [editedApuData, setEditedApuData] = useState<any[]>(analysis.apu_data || []);
  const [isApuDirty, setIsApuDirty] = useState(false);
  const [isSavingApu, setIsSavingApu] = useState(false);

  useEffect(() => {
    if (analysis.apu_data) {
      setEditedApuData(analysis.apu_data);
      setIsApuDirty(false);
    }
  }, [analysis.apu_data]);

  // Project Resource DB (Project Registry)
  const resourceRegistry = useMemo(() => {
    const registry = {
      mano_obra: new Set<string>(),
      maquinaria: new Set<string>(),
      materiales: new Set<string>()
    };

    editedApuData.forEach(apu => {
      if (apu.is_title) return;
      ['mano_obra', 'maquinaria', 'materiales'].forEach(cat => {
        if (Array.isArray(apu[cat])) {
          apu[cat].forEach((res: any) => {
            const name = res.descripcion || res.nombre;
            if (name) registry[cat as keyof typeof registry].add(name);
          });
        }
      });
    });

    return {
      mano_obra: Array.from(registry.mano_obra).sort(),
      maquinaria: Array.from(registry.maquinaria).sort(),
      materiales: Array.from(registry.materiales).sort(),
      all: Array.from(new Set([...registry.mano_obra, ...registry.maquinaria, ...registry.materiales])).sort()
    };
  }, [editedApuData]);

  // --- ROBUST HIERARCHY & SUBTOTALS ---
  const itemsPresupuesto = useMemo(() => {
    const baseItems = analysis.items_presupuesto || [];
    if (!baseItems.length) return baseItems;
    
    // 1. Map edited APUs for quick lookup
    const apuMap: Record<string, any> = {};
    editedApuData.forEach(apu => {
      const code = (apu.item || apu.codigo || '').toString().trim();
      if (code) apuMap[code] = apu;
    });

    const getCodeDepth = (code: string) => {
      const c = code.trim().replace(/[\.\-\s]+$/, '');
      if (!c) return 0;
      
      // Match backend _get_item_depth logic exactly
      if (/^[A-Z]$/i.test(c)) return 0;
      // Multi-digit bare integers (e.g. 5100, 5200) are MOP subtitles → depth 1
      // Single/double digit bare integers remain depth 0
      if (/^\d+$/.test(c)) return c.length > 2 ? 1 : 0;
      if (/^\d+\.\d+$/.test(c)) return 1;
      if (/^\d+\.\d+\.\d+$/.test(c) || /^\d+-\d+[a-z]?$/i.test(c)) return 2;
      
      const dots = (c.match(/\./g) || []).length;
      const dashes = (c.match(/-/g) || []).length;
      return dots + dashes;
    };

    // 2. Sequential Parent Discovery & Initial Setup
    const lastParents: Record<number, number> = {}; // Stores index of last seen title at each CODE DEPTH
    // Tracks the start of the current "letter-section group" — when consecutive letter sections
    // appear (e.g. C followed immediately by D with no depth-1 items in between), numeric subtitles
    // like 5100 should be parented to the FIRST letter section of that group (C), not the last (D).
    let letterGroupStartIdx: number | null = null;
    let hadDepth1SinceLetter = false; // Whether a depth-1 item appeared since the last letter section
    
    const processedItems = baseItems.map((item: any, idx: number) => {
      const code = (item.item || item.codigo || '').toString().trim();
      const codeDepth = getCodeDepth(code);
      const isLetterCode = /^[A-Z]$/i.test(code.trim());
      
      const isTitle = item.is_title === true || 
                     (codeDepth < 2 && (!item.unidad || parseFloat(item.cantidad) === 0));
      
      // Virtual depth: items are 1 level deeper than titles of same code format
      const virtualDepth = codeDepth + (isTitle ? 0 : 1);
      
      // Find parent: the most recent preceding item of a higher virtual level
      let parentIdx: number | null = null;

      if (isTitle && codeDepth === 1 && !isLetterCode) {
        // Numeric depth-1 subtitle (5100, 5200):
        // If no depth-1 items appeared since the current letter group started, 5100 belongs
        // to the FIRST letter of the group (e.g., C), not the last letter (D).
        parentIdx = letterGroupStartIdx;
      } else {
        for (let d = virtualDepth - 1; d >= 0; d--) {
          if (lastParents[d] !== undefined) {
            parentIdx = lastParents[d];
            break;
          }
        }
      }
      const updatedApu = apuMap[code];
      
      if (isTitle) {
        if (isLetterCode) {
          // Start a new letter group only if there were depth-1 items since the last letter.
          // If D immediately follows C (no depth-1 items in between), preserve letterGroupStartIdx = C.
          if (letterGroupStartIdx === null || hadDepth1SinceLetter) {
            letterGroupStartIdx = idx;
            hadDepth1SinceLetter = false;
          }
          // D following C with no children reuses letterGroupStartIdx = C ✓
        } else if (codeDepth === 1) {
          // A numeric subtitle appeared — it now "owns" the depth-1 slot
          hadDepth1SinceLetter = true;
        }
        lastParents[codeDepth] = idx;
        // Reset deeper parents
        Object.keys(lastParents).forEach(d => {
          const depthVal = parseInt(d);
          if (depthVal > codeDepth) delete lastParents[depthVal];
        });
      } else if (codeDepth >= 1) {
        // A regular (non-title) item at depth ≥1 — mark that depth-1 content appeared
        if (codeDepth === 1 || virtualDepth >= 2) hadDepth1SinceLetter = true;
      }

      let it = { 
        ...item, 
        _depth: virtualDepth, 
        _parent_idx: parentIdx,
        is_partida: isTitle,
        total: isTitle ? 0 : (parseFloat(item.total) || 0)
      };

      if (updatedApu && !isTitle) {
        const qty = parseFloat(item.cantidad) || 0;
        const up = updatedApu.precio_unitario || updatedApu.precio_unitario_apu || 0;
        it.precio_unitario = up;
        it.total = qty * up;
        it.unit_price = up;
        it.total_price = qty * up;
      }
      return it;
    });

    // 3. Bottom-up Agregation (Sequential Sum)
    for (let i = processedItems.length - 1; i >= 0; i--) {
      const item = processedItems[i];
      if (item._parent_idx !== null && processedItems[item._parent_idx]) {
        processedItems[item._parent_idx].total = (processedItems[item._parent_idx].total || 0) + (item.total || 0);
        processedItems[item._parent_idx].total_price = processedItems[item._parent_idx].total;
      }
    }

    return processedItems;
  }, [analysis.items_presupuesto, editedApuData]);

  // High-level totals based for the Dashboard and simulation - O(N)
  const totalNetoLive = useMemo(() => {
    return itemsPresupuesto
      .filter((item: any) => !item.is_partida)
      .reduce((sum: number, item: any) => sum + (item.total || 0), 0);
  }, [itemsPresupuesto]);

  // === HELPERS DE ANÁLISIS ===
  const isPartida = useCallback((item: any): boolean => {
    const code = (item.item || item.codigo || '').toString().trim();
    // Only match codes ending with ".-" or single letters like "A", "B"
    return /^[A-Z][\.\-\s]*$/.test(code) || /[\.\-]$/.test(code);
  }, []);

  const getBudgetQuantity = useCallback((itemCode: string) => {
    const code = itemCode?.toString().trim();
    const match = itemsPresupuesto.find((i: any) =>
      (i.item || i.codigo || '').toString().trim() === code
    );
    return match ? Number(match.cantidad || 0) : 0;
  }, [itemsPresupuesto]);

  const recalculateApuTotals = useCallback((apu: any) => {
    let newUnitTotal = 0;
    ['mano_obra', 'maquinaria', 'materiales'].forEach(cat => {
      (apu[cat] || []).forEach((it: any) => {
        const itQty = parseFloat(it.cantidad) || 0;
        const itPrice = parseFloat(it.precio_unitario || it.unit_price) || 0;
        newUnitTotal += itQty * itPrice;
      });
    });
    apu.precio_unitario_apu = newUnitTotal;
    apu.precio_unitario = newUnitTotal;
    
    // Update global total based on budget quantity
    const itemCode = apu.item || apu.codigo || '-';
    const budgetQty = getBudgetQuantity(itemCode);
    apu.total_apu = newUnitTotal * (budgetQty || 1);
  }, [getBudgetQuantity]);

  const handleUpdateApuCell = useCallback((apuIdx: number, category: 'mano_obra' | 'maquinaria' | 'materiales', itemIdx: number, field: string, value: any) => {
    setEditedApuData(prev => {
      const newData = [...prev];
      const apu = { ...newData[apuIdx] };
      const items = [...(apu[category] || [])];
      
      let val = value;
      if (field === 'cantidad' || field === 'precio_unitario') {
        val = parseFloat(value) || 0;
      }

      items[itemIdx] = { ...items[itemIdx], [field]: val };
      
      // Recalculate total for this row
      const qty = parseFloat(items[itemIdx].cantidad) || 0;
      const price = parseFloat(items[itemIdx].precio_unitario || items[itemIdx].unit_price) || 0;
      items[itemIdx].total = qty * price;
      
      apu[category] = items;
      recalculateApuTotals(apu);
      
      newData[apuIdx] = apu;
      return newData;
    });
    setIsApuDirty(true);
  }, [recalculateApuTotals]);

  const handleAddApuItem = useCallback((apuIdx: number, category: 'mano_obra' | 'maquinaria' | 'materiales') => {
    setEditedApuData(prev => {
      const newData = [...prev];
      const apu = { ...newData[apuIdx] };
      const items = [...(apu[category] || [])];
      
      items.push({
        descripcion: '',
        unidad: 'UN',
        cantidad: 1,
        precio_unitario: 0,
        total: 0
      });
      
      apu[category] = items;
      newData[apuIdx] = apu;
      return newData;
    });
    setIsApuDirty(true);
  }, []);

  const handleRemoveApuItem = useCallback((apuIdx: number, category: 'mano_obra' | 'maquinaria' | 'materiales', itemIdx: number) => {
    setEditedApuData(prev => {
      const newData = [...prev];
      const apu = { ...newData[apuIdx] };
      const items = [...(apu[category] || [])];
      
      items.splice(itemIdx, 1);
      
      apu[category] = items;
      recalculateApuTotals(apu);
      
      newData[apuIdx] = apu;
      return newData;
    });
    setIsApuDirty(true);
  }, [recalculateApuTotals]);

  const handleSaveApu = async () => {
    try {
      setIsSavingApu(true);
      // Robustly find analysis ID across different possible structures
      const analysisId = 
        analysisProp?.analysis_id || 
        analysisProp?.id || 
        analysisProp?.data?.id ||
        analysis?.analysis_id || 
        analysis?.id;

      if (!analysisId) {
        console.error("Analysis object structure:", { analysisProp, analysis });
        throw new Error("ID de análisis no encontrado");
      }

      await budgetAnalyzerApi.updateAnalysis(analysisId, { 
        apu_data: editedApuData 
      });
      
      toast.success("APU actualizado exitosamente. Los totales se han recalculado.");
      setIsApuDirty(false);
      
      // Optional: force a refresh of the page or parent state if needed
      // window.location.reload(); 
    } catch (error: any) {
      console.error("Error saving APU:", error);
      toast.error("Error al guardar cambios: " + (error.message || "Error desconocido"));
    } finally {
      setIsSavingApu(false);
    }
  };

  // === SMOOTH SLIDER ===
  // Renders an <input type="range"> with a CSS gradient track fill — no snap/jump.
  const SmoothSlider = ({
    value, min, max, onChange, className = ''
  }: { value: number; min: number; max: number; onChange: (v: number) => void; className?: string }) => {
    const [localValue, setLocalValue] = useState(value);

    // Sync local value when external value changes
    useEffect(() => {
      setLocalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVal = parseFloat(e.target.value);
      setLocalValue(newVal);
    };

    const handleCommit = () => {
      if (localValue !== value) {
        onChange(localValue);
      }
    };

    const pct = ((localValue - min) / (max - min)) * 100;
    const positive = localValue >= 0;
    const fillColor = positive ? '#f97316' : '#ef4444';
    
    const trackStyle = {
      background: `linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${pct}%, #e2e8f0 ${pct}%, #e2e8f0 100%)`,
      WebkitAppearance: 'none' as const,
    };

    return (
      <div className={`w-full group/slider ${className}`}>
        <input
          type="range"
          min={min}
          max={max}
          step={0.1}
          value={localValue}
          onChange={handleChange}
          onMouseUp={handleCommit}
          onBlur={handleCommit}
          onTouchEnd={handleCommit}
          style={trackStyle}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer outline-none transition-all focus:ring-2 focus:ring-orange-500/20"
        />
        <style jsx>{`
          input[type='range']::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 14px;
            height: 14px;
            background: #ffffff;
            border: 2px solid ${fillColor};
            border-radius: 50%;
            cursor: grab;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          }
          input[type='range']::-webkit-slider-thumb:hover {
            transform: scale(1.2);
            box-shadow: 0 0 10px ${fillColor}40;
          }
          input[type='range']::-webkit-slider-thumb:active {
            cursor: grabbing;
            transform: scale(0.95);
            background: ${fillColor};
          }
          input[type='range']::-moz-range-thumb {
            width: 12px;
            height: 12px;
            background: #ffffff;
            border: 2px solid ${fillColor};
            border-radius: 50%;
            cursor: grab;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
        `}</style>
      </div>
    );
  };

  const formatCurrency = (amount: number) => {
    if (!amount || isNaN(amount)) return '$0';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getPercentageColor = (pct: number) => {
    if (pct < 1) return 'text-slate-400';
    if (pct < 3) return 'text-sky-500 font-medium';
    if (pct < 5) return 'text-amber-500 font-bold';
    return 'text-rose-600 font-black';
  };

  const apuData = useMemo(() => initialApuData.filter((item: any) => !isPartida(item)), [initialApuData, isPartida]);

  // Simplified subtotal helper (already pre-calculated in itemsPresupuesto)
  const getPartidaSubtotal = useCallback((parentItem: any, items: any[]): number => {
    // We just return the pre-calculated total from the item itself
    return parentItem.total || parentItem.total_price || 0;
  }, []);

  // Find the parent partida code for a sub-item (e.g. "2.3.1" -> "2")
  const getParentPartidaCode = (item: any): string => {
    const code = (item.item || item.codigo || '').toString().trim();
    const dotIndex = code.indexOf('.');
    return dotIndex > 0 ? code.substring(0, dotIndex) : '';
  };

  // Smart quantity formatting — no trailing zeros
  const formatQuantity = (qty: number): string => {
    if (qty === 0) return '0';
    // If it's an integer, show without decimals
    if (Number.isInteger(qty)) return qty.toLocaleString('es-CL');
    // Otherwise show up to 2 decimals, trimming trailing zeros
    return qty.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  // Ordenación correcta del Presupuesto:
  // Agrupa ítems por sección letra (B, C, D) y los ordena respetando la jerarquía del Excel.
  // Maneja el caso donde el backend manda: C, D, [5100 y sus hijos] → los agrupa bajo C correctamente.
  const naturalSortItems = (items: any[]) => {
    const isLetterTitle = (item: any) => {
      const code = (item.item || item.codigo || '').toString().trim();
      // En presupuestos MOP, las letras (A, B, C, D...) siempre son títulos de sección,
      // incluso si incluyen unidad (ej: "gl") o cantidad.
      return /^[A-Z][\.\-]?$/i.test(code);
    };

    const parseCode = (code: string): number[] => {
      if (/^[A-Z][\.\-]?$/.test(code)) {
        return [code.charCodeAt(0) - 64, 0]; // A=1, B=2, C=3, D=4...
      }
      const match = code.replace('.-', '').match(/^[\d]+(?:\.[\d]+)*/);
      if (!match) return [Infinity];
      return match[0].split('.').map(Number);
    };

    const codeOf = (item: any) => (item.item || item.codigo || '').toString().trim();

    // Step 1: Identify letter-section boundaries
    // We establish clusters of items. Letters that appear consecutively (e.g. C, D) 
    // without items between them form a single cluster. The children following them
    // belong conceptually to the first letter in that cluster.
    type Cluster = { letters: any[]; children: any[] };
    const clusters: Cluster[] = [];
    let orphans: any[] = []; 

    let currentCluster: Cluster | null = null;
    let pendingLetters: any[] = [];

    for (const item of items) {
      if (isLetterTitle(item)) {
        pendingLetters.push(item);
      } else {
        if (pendingLetters.length > 0) {
          // The appearance of a non-letter item flushes any pending letters into a new cluster.
          currentCluster = { letters: pendingLetters, children: [] };
          clusters.push(currentCluster);
          pendingLetters = [];
        }
        
        if (currentCluster) {
          currentCluster.children.push(item);
        } else {
          orphans.push(item);
        }
      }
    }
    // Flush any remaining trailing letters
    if (pendingLetters.length > 0) {
      clusters.push({ letters: pendingLetters, children: [] });
    }

    // Step 2: Sort clusters by their first letter's code (B < C < D ...)
    clusters.sort((a, b) => {
      const cA = parseCode(codeOf(a.letters[0]));
      const cB = parseCode(codeOf(b.letters[0]));
      for (let i = 0; i < Math.max(cA.length, cB.length); i++) {
        if ((cA[i] ?? 0) !== (cB[i] ?? 0)) return (cA[i] ?? 0) - (cB[i] ?? 0);
      }
      return 0;
    });

    // Step 3: Within each cluster's children, group subtitles with their items
    const sortByCode = (a: any, b: any) => {
      const cA = parseCode(codeOf(a));
      const cB = parseCode(codeOf(b));
      for (let i = 0; i < Math.max(cA.length, cB.length); i++) {
        if ((cA[i] ?? 0) !== (cB[i] ?? 0)) return (cA[i] ?? 0) - (cB[i] ?? 0);
      }
      return 0;
    };

    const result: any[] = [...orphans];
    for (const cluster of clusters) {
      // Emit first letter section as main header
      result.push(cluster.letters[0]);
      // Group children by subtitle, preserving subtitle→items structure
      const subtitles: any[] = [];
      const subtitleChildrenMap: Record<string, any[]> = {};
      let lastSubCode: string | null = null;

      for (const child of cluster.children) {
        const isSubtitle = child.is_partida || child.is_title;
        if (isSubtitle) {
          const sc = codeOf(child);
          subtitles.push(child);
          subtitleChildrenMap[sc] = [];
          lastSubCode = sc;
        } else {
          if (lastSubCode) {
            subtitleChildrenMap[lastSubCode].push(child);
          } else {
            // Direct child of letter with no subtitle
            subtitles.push(child);
          }
        }
      }
      // Sort subtitles, then emit each with its children
      subtitles.sort(sortByCode);
      for (const sub of subtitles) {
        result.push(sub);
        const sc = codeOf(sub);
        if (subtitleChildrenMap[sc]) {
          subtitleChildrenMap[sc].sort(sortByCode);
          result.push(...subtitleChildrenMap[sc]);
        }
      }
      // Emit remaining letter sections in the cluster (siblings like D that had no subtitles of their own)
      for (let i = 1; i < cluster.letters.length; i++) {
        result.push(cluster.letters[i]);
      }
    }

    return result;
  };

  const sortedItems = useMemo(() => naturalSortItems(itemsPresupuesto), [itemsPresupuesto]);


  const numberToWords = (n: number): string => {
    const units = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const tens = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const specials = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];

    if (n === 0) return 'CERO';
    if (n > 2000000000) return 'DATO FUERA DE RANGO'; // Límite simple para este helper

    // Heurística simple para el simulador
    return "VALOR EN PALABRAS (SIMULACIÓN AUTOMÁTICA)";
  };

  const extractBudget = () => {
    return analysis.presupuesto?.total_con_iva
      || analysis.presupuesto_estimado?.total_clp
      || analysis.resumen_consolidado?.total_con_iva
      || projectInfo.estimated_budget
      || 0;
  };

  const activeTabs = useMemo(() => {
    return [
      { id: 'resumen', label: 'Resumen', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
      { id: 'presupuesto', label: 'Presupuesto', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { id: 'apu', label: 'Detalle APU', icon: Search, color: 'text-blue-600', bg: 'bg-blue-50' },
      { id: 'especificaciones', label: 'Especif. Técnicas', icon: ClipboardList, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      { id: 'materiales', label: 'Materiales', icon: Package, color: 'text-orange-600', bg: 'bg-orange-50' },
      { id: 'maquinaria', label: 'Maquinaria', icon: Truck, color: 'text-amber-600', bg: 'bg-amber-50' },
      { id: 'profesionales', label: 'Profesionales', icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50' },
      { id: 'gastos_generales', label: 'Gastos Generales', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { id: 'senaletica', label: 'Señalética', icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
      { id: 'normativas', label: 'Normativas', icon: BookOpen, color: 'text-rose-600', bg: 'bg-rose-50' },
      { id: 'tramos', label: 'Tramos', icon: MapPin, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      { id: 'cubicaciones', label: 'Cubicaciones', icon: Ruler, color: 'text-blue-600', bg: 'bg-blue-50' },
      { id: 'plazos', label: 'Plazos', icon: Clock, color: 'text-cyan-600', bg: 'bg-cyan-50' },
      { id: 'riesgos', label: 'Riesgos', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
      { id: 'estrategia', label: 'Estrategia', icon: Shield, color: 'text-violet-600', bg: 'bg-violet-50' },
      { id: 'propuesta', label: 'Simulador Propuesta', icon: Settings2, color: 'text-orange-600', bg: 'bg-orange-50' },
      { id: 'documentos', label: 'Documentos', icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50' },
      { id: 'referencias', label: 'Referencias', icon: Search, color: 'text-blue-600', bg: 'bg-blue-50' },
    ].filter(tab => {
      if (tab.id === 'resumen' || tab.id === 'documentos') return true;
      if (tab.id === 'presupuesto') return itemsPresupuesto.length > 0;
      if (tab.id === 'apu') return initialApuData.length > 0;
      if (tab.id === 'especificaciones') return especificacionesTecnicas.length > 0;
      if (tab.id === 'materiales') return materiales.length > 0;
      if (tab.id === 'maquinaria') return maquinaria.length > 0 || equipamientoObra.length > 0;
      if (tab.id === 'profesionales') return profesionalesRequeridos.length > 0 || manoObra.length > 0;
      if (tab.id === 'gastos_generales') return true; 
      if (tab.id === 'senaletica') return senaletica.length > 0 || seguridadObra.length > 0;
      if (tab.id === 'normativas') return normativas.length > 0;
      if (tab.id === 'tramos') return tramos.length > 0;
      if (tab.id === 'cubicaciones') return cubicaciones.length > 0;
      if (tab.id === 'plazos') return (plazos.duracion_total_dias || 0) > 0;
      if (tab.id === 'riesgos') return riesgos.length > 0;
      if (tab.id === 'estrategia') return (analisisEstrategico.ventajas?.length || 0) > 0 || (analisisEstrategico.dolores?.length || 0) > 0;
      if (tab.id === 'propuesta') return extractBudget() > 0;
      return false;
    });
  }, [itemsPresupuesto.length, initialApuData.length, especificacionesTecnicas.length, materiales.length, maquinaria.length, equipamientoObra.length, profesionalesRequeridos.length, manoObra.length, senaletica.length, seguridadObra.length, normativas.length, tramos.length, cubicaciones.length, plazos.duracion_total_dias, riesgos.length, analisisEstrategico, extractBudget]);

  const handleExport = async (format: 'pdf' | 'xlsx') => {
    try {
      setIsExporting(true);
      const isPdf = format === 'pdf';
      toast.info(`Generando informe ${isPdf ? 'PDF' : 'Excel'}...`);

      const blob = await budgetAnalyzerApi.exportAnalysis(analysis, { margin }, format);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const extension = isPdf ? 'pdf' : 'xlsx';
      link.setAttribute('download', `Informe_Licitacion_${projectInfo.name || 'ResuelveYA'}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Informe ${isPdf ? 'PDF' : 'Excel'} generado exitosamente`);
    } catch (error) {
      console.error(`Error exporting ${format}:`, error);
      toast.error(`Error al generar el informe ${format.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
  };

  const getProjectTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      vial_mop: 'Obra MOP',
      municipal: 'Obra Municipalidad',
      auto: 'Proyecto Identificado Automáticamente',
      residencial: 'Obra Residencial',
      comercial: 'Obra Comercial',
      edificacion: 'Edificación',
      sanitario: 'Obra Sanitaria',
      metalico: 'Estructura Metálica'
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6 space-y-6 animate-in fade-in duration-700">
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200 p-6 shadow-sm group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-slate-50 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-blue-50/50" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="space-y-4 max-w-3xl">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="group/btn h-8 px-2 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover/btn:-translate-x-1" />
              Volver al historial
            </Button>

            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                {projectInfo.file_name && !projectInfo.file_name.includes('Consolidado') && !projectInfo.file_name.includes('Stream')
                  ? projectInfo.file_name
                  : (proyecto.nombre || projectInfo.name || (projectInfo.type ? getProjectTypeLabel(projectInfo.type) : 'Análisis de Licitación'))}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">
                  <MapPin className="w-3 h-3 mr-1.5" />
                  {projectInfo.location || 'Chile'}
                </div>
                <div className="flex items-center px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold">
                  <Settings2 className="w-3 h-3 mr-1.5" />
                  {getProjectTypeLabel(projectInfo.type || 'Infraestructura')}
                </div>
                <div className="flex items-center px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-semibold">
                  <FileText className="w-3 h-3 mr-1.5" />
                  {(analysis.documentos_info?.length || analysis.archivos?.length || data.archivos?.length || 0)} docs analizados
                </div>
              </div>
            </div>

            {analysis.descripcion_proyecto && (
              <p className="text-slate-600 leading-relaxed text-base italic border-l-4 border-slate-100 pl-4 py-1">
                {analysis.descripcion_proyecto}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto">
            <Button
              className="bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-50"
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
            >
              <Download className={`w-4 h-4 mr-2 ${isExporting ? 'animate-bounce' : ''}`} />
              {isExporting ? 'Generando...' : 'Exportar Informe PDF'}
            </Button>
            <Button
              className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 shadow-sm transition-all active:scale-95 disabled:opacity-50"
              onClick={() => handleExport('xlsx')}
              disabled={isExporting}
            >
              <FileSpreadsheet className={`w-4 h-4 mr-2 ${isExporting ? 'animate-bounce' : ''}`} />
              {isExporting ? 'Generando...' : 'Exportar Informe Excel'}
            </Button>
            <div className="text-[10px] text-slate-400 text-center font-medium uppercase tracking-wider">
              Generado el {new Date().toLocaleDateString('es-CL')}
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="col-span-1 md:col-span-2 relative overflow-hidden bg-slate-900 border-none rounded-2xl p-6 text-white shadow-2xl shadow-blue-200/50">
          {(() => {
            // Use resumen_consolidado or presupuesto_estimado as authoritative source.
            // Check multiple common nested paths because structure varies between standard and stream analysis.
            const staticNeto = analysis.resumen_consolidado?.total_neto
              || data.resumen_consolidado?.total_neto
              || analysis.presupuesto_estimado?.total_neto
              || analysis.presupuesto_estimado?.neto_clp
              || analysis.presupuesto?.total_neto
              || 0;
            
            // Prioritize live calculated total from APUs
            const neto = totalNetoLive || staticNeto;
            const ggUtil = neto * 0.25;
            const subtotal = neto + ggUtil;
            const iva = (analysis.resumen_consolidado?.iva || analysis.presupuesto_estimado?.iva || (subtotal * 0.19));

            return (
              <>
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent opacity-50" />
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                      <DollarSign className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Presupuesto Referencial Sugerido</span>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                      <div className="text-xs font-medium text-blue-300 mb-1 leading-none">Total Neto</div>
                      <div className="text-5xl font-black tracking-tight leading-none">
                        {formatCurrency(neto)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[10px] font-medium text-slate-400 bg-white/5 p-3 rounded-xl border border-white/5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                          Neto (CD):
                        </span>
                        <span className="text-white font-bold">{formatCurrency(neto)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          GG & Util (25%):
                        </span>
                        <span className="text-white font-bold">{formatCurrency(ggUtil)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-1">
                        <span className="flex items-center gap-1.5 font-bold text-blue-400">
                          Subtotal (Neto + GG):
                        </span>
                        <span className="text-white font-bold">{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-1">
                        <span className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          IVA (19%):
                        </span>
                        <span className="text-white font-bold">{formatCurrency(iva)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </Card>

        <div className="grid grid-cols-2 gap-3 h-full">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-200 transition-all group">
            <Clock className="w-6 h-6 text-cyan-500 mb-2 transition-transform group-hover:scale-110" />
            <div>
              <p className="text-xl font-bold text-slate-900">{plazos.duracion_total_dias || '-'}</p>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Días Plazo</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-200 transition-all group">
            <Users className="w-6 h-6 text-emerald-500 mb-2 transition-transform group-hover:scale-110" />
            <div>
              <p className="text-xl font-bold text-slate-900">{profesionalesRequeridos.length}</p>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Profesionales</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-orange-200 transition-all group">
            <Truck className="w-6 h-6 text-orange-500 mb-2 transition-transform group-hover:scale-110" />
            <div>
              <p className="text-xl font-bold text-slate-900">{maquinaria.length}</p>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Maquinaria</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-rose-200 transition-all group">
            <AlertTriangle className="w-6 h-6 text-rose-500 mb-2 transition-transform group-hover:scale-110" />
            <div>
              <p className="text-xl font-bold text-slate-900">{riesgos.length}</p>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Críticos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Container */}
      <Tabs defaultValue="resumen" className="space-y-8">
        {/* Sentinel: marks the natural position of the tabs */}
        <div ref={tabsSentinelRef} className="h-0" />
        <div className={`sticky top-[60px] z-40 py-2 transition-all duration-300 ease-in-out ${!tabsPinned || headerVisible ? 'translate-y-0 opacity-100' : '-translate-y-[120%] opacity-0 pointer-events-none'}`}>
          <TabsList className="flex flex-wrap h-auto p-1 bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/40 gap-0.5 overflow-x-auto no-scrollbar">
            {activeTabs.map(tab => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all text-slate-500 font-semibold text-xs hover:text-slate-900"
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="min-h-[600px]">
          {/* Tab: Resumen Ejecutivo */}
          <TabsContent value="resumen" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <Card className="rounded-[1.5rem] border-slate-200 p-6 overflow-hidden bg-white shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-50 rounded-xl">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Resumen Estratégico</h2>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Síntesis consolidada</p>
                    </div>
                  </div>
                  <div className="prose prose-slate max-w-none prose-p:text-slate-600 prose-p:leading-relaxed prose-p:text-sm">
                    {(() => {
                      const narrativeText =
                        analysis.resumen_ejecutivo ||
                        analysis.resumen_consolidado?.resumen_ejecutivo ||
                        analysis.resumen_general ||
                        analysis.descripcion_general ||
                        analysis.resumen ||
                        analysis.descripcion_proyecto ||
                        '';

                      if (narrativeText) {
                        return (
                          <div className="space-y-6" dangerouslySetInnerHTML={{
                            __html: narrativeText
                              .replace(/\*\*(.*?)\*\*/g, '<b class="text-slate-950 font-bold">$1</b>')
                              .replace(/\n/g, '<br/>')
                          }} />
                        );
                      }

                      // Fallback: structured info panel from available data
                      const totalItems = itemsPresupuesto.filter((i: any) => !i.is_partida).length;
                      const totalDocs = documentosInfo.length || archivos.length || 0;
                      const totalNeto = analysis.resumen_consolidado?.total_neto || totalNetoLive || 0;

                      return (
                        <div className="space-y-4">
                          <p className="text-slate-500 text-sm leading-relaxed">
                            Análisis de <strong className="text-slate-800">{totalDocs > 0 ? `${totalDocs} documentos` : 'múltiples documentos'}</strong> PDF completado.
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                            {totalNeto > 0 && (
                              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Presupuesto Neto</p>
                                <p className="text-lg font-black text-emerald-700">{formatCurrency(totalNeto)}</p>
                              </div>
                            )}
                            {totalItems > 0 && (
                              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Ítems Detectados</p>
                                <p className="text-lg font-black text-blue-700">{totalItems}</p>
                              </div>
                            )}
                            {totalDocs > 0 && (
                              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Documentos</p>
                                <p className="text-lg font-black text-slate-700">{totalDocs}</p>
                              </div>
                            )}
                          </div>
                          {proyecto.nombre && (
                            <div className="mt-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Proyecto</p>
                              <p className="text-sm font-semibold text-indigo-800">{proyecto.nombre}</p>
                            </div>
                          )}
                          {requisitosTecnicos.length > 0 && (
                            <div className="mt-2">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Requisitos Técnicos Clave</p>
                              <ul className="space-y-1">
                                {requisitosTecnicos.slice(0, 4).map((req: any, i: number) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                                    {typeof req === 'string' ? req : req.descripcion || req.nombre || JSON.stringify(req)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </Card>

                {/* Condiciones Especiales */}
                {condicionesEspeciales.length > 0 && (
                  <Card className="rounded-[2.5rem] border-slate-200 p-10 bg-white shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-[100px] -mr-10 -mt-10 opacity-50" />
                    <div className="flex items-center gap-4 mb-8 relative z-10">
                      <div className="p-3 bg-purple-50 rounded-2xl">
                        <Shield className="w-6 h-6 text-purple-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900">Condiciones del Contrato</h3>
                    </div>
                    <div className="grid gap-4 relative z-10">
                      {condicionesEspeciales.map((cond: any, i: number) => (
                        <div key={i} className="group p-5 bg-slate-50 hover:bg-purple-50/50 border border-slate-100 rounded-2xl transition-all flex items-start gap-4">
                          <span className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:border-purple-200 group-hover:text-purple-500">
                            {i + 1}
                          </span>
                          <span className="text-slate-700 font-medium">
                            {typeof cond === 'string' ? cond : cond.descripcion}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>

              <div className="space-y-8">
                {/* Documentos Info Card */}
                <Card className="rounded-[2.5rem] border-slate-200 p-8 bg-white shadow-sm">
                  <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Package className="w-5 h-5 text-slate-400" />
                    Estructura Documental
                  </h3>
                  <div className="space-y-4">
                    {documentosInfo.map((doc: any, i: number) => (
                      <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/20 transition-all group">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                            {doc.tipo || 'ANÁLISIS'}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {doc.nombre_limpio || doc.nombre_original}
                        </h4>
                        {doc.resumen && <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">{doc.resumen}</p>}
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Quick Info Box */}
                <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-xl shadow-indigo-100 overflow-hidden relative group">
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl transition-transform group-hover:scale-110" />
                  <Briefcase className="w-10 h-10 mb-6 text-indigo-200" />
                  <h4 className="text-2xl font-bold mb-2">Licitación Profesional</h4>
                  <p className="text-indigo-100 text-sm leading-relaxed mb-6">
                    Este análisis ha sido generado con inteligencia artificial especializada en procesos MOP Chile.
                  </p>
                  <div className="h-1 w-12 bg-indigo-400 rounded-full" />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Gastos Generales (NUEVO) */}
          <TabsContent value="gastos_generales" className="animate-in slide-in-from-bottom-4 duration-500">
            <GeneralExpensesView
              analysisId={analysisProp?.analysis_id || data.analysis_id || data.metadata?.analysis_id}
              initialData={gastosGeneralesData}
              profesionales={profesionalesRequeridos}
              onSave={(updatedGG) => {
                // Actualizar localmente si es necesario
                console.log('GG saved:', updatedGG);
              }}
            />
          </TabsContent>

          {/* Tab: Presupuesto */}
          <TabsContent value="presupuesto" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <Card className="rounded-[2.5rem] border-slate-200 overflow-hidden bg-white shadow-sm">
              <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 rounded-2xl">
                    <DollarSign className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Itemizado del Proyecto</h2>
                    <p className="text-sm text-slate-400 font-medium">Detalle de {itemsPresupuesto.length} Ítems detectados</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Peso Total</p>
                  <p className="text-lg font-black text-emerald-600">100%</p>
                </div>
              </div>


              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-[9px] font-bold uppercase tracking-widest border-b border-slate-100">
                      <th className="px-3 py-2 text-left w-20">Item</th>
                      <th className="px-3 py-2 text-left">Descripción de Partida</th>
                      <th className="px-3 py-2 text-right">Cant.</th>
                      <th className="px-3 py-2 text-center">Und.</th>
                      <th className="px-3 py-2 text-right">P. Unitario</th>
                      <th className="px-8 py-2 text-right bg-emerald-50/50 text-emerald-600">P. Total</th>
                      <th className="px-3 py-2 text-right text-slate-400 text-[9px] w-14">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedItems.map((item: any, idx: number) => {
                      const totalNeto = analysis.resumen_consolidado?.total_neto || 0;
                      if (isPartida(item) || item.is_partida) {
                        // Use backend-computed subtotal (item.total set by _compute_section_subtotals)
                        // Fallback to frontend calculation for backward compat
                        const subtotal = (item.total && item.total > 0)
                          ? item.total
                          : getPartidaSubtotal(item, sortedItems);
                        const pctOfTotal = totalNeto > 0 ? (subtotal / totalNeto) * 100 : 0;
                        return (
                          <tr key={idx} className="bg-slate-100/80 border-t-2 border-slate-300">
                            <td className="px-3 py-3 font-black text-slate-500 text-xs">{item.item || item.codigo || ''}</td>
                            <td className="px-3 py-3 font-black text-slate-800 text-sm uppercase tracking-wide" colSpan={4}>
                              {item.descripcion || '-'}
                            </td>
                            <td className="px-8 py-3 text-right font-black text-slate-800 bg-slate-200/50 text-sm tabular-nums">
                              {subtotal > 0 ? formatCurrency(subtotal) : ''}
                            </td>
                            <td className="px-3 py-3 text-right">
                              <span className="font-black text-slate-600 text-xs">
                                {pctOfTotal > 0 ? pctOfTotal.toFixed(1) + '%' : '-'}
                              </span>
                            </td>
                          </tr>
                        );
                      }
                      // Sub-item: compute % relative to parent partida
                      const parentCode = getParentPartidaCode(item);
                      const parentPartida = parentCode ? sortedItems.find((p: any) => (p.item || p.codigo || '').toString().trim() === parentCode) : null;
                      const partidaSubtotal = parentPartida ? getPartidaSubtotal(parentPartida, sortedItems) : totalNeto;
                      const itemTotal = item.total || item.total_price || 0;
                      const pctOfPartida = partidaSubtotal > 0 ? (itemTotal / partidaSubtotal) * 100 : 0;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors group relative">
                          <td className="px-3 py-1.5 font-bold text-slate-400 text-[10px] tracking-tighter group-hover:text-blue-500">{item.item || item.codigo || '-'}</td>
                          <td className="px-4 py-3 relative">
                            <div className="flex flex-col">
                              <p className="text-slate-900 font-semibold text-xs line-clamp-3 leading-tight group/info cursor-help">
                                {item.descripcion || '-'}
                                {(item.detalles_tecnicos || item.referencia) && (
                                  <span className="ml-2 inline-flex items-center text-[10px] text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <AlertCircle className="w-3 h-3" />
                                  </span>
                                )}
                              </p>
                              {/* Custom Hover Tooltip */}
                              {(item.detalles_tecnicos || item.referencia || item.referencia_ia || item.calculo_cubicacion || item.referencia_cubicacion) && (
                                <div className="absolute left-6 top-[80%] z-[100] hidden group-hover:block w-80 p-4 bg-slate-900 text-white text-[11px] rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200 pointer-events-none border border-slate-700">
                                  {item.detalles_tecnicos && (
                                    <div className="mb-3">
                                      <p className="text-blue-400 font-bold uppercase tracking-widest text-[9px] mb-1">Detalle Técnico</p>
                                      <p className="text-slate-200 leading-tight">{item.detalles_tecnicos}</p>
                                    </div>
                                  )}
                                  {item.calculo_cubicacion && (
                                    <div className="mb-3">
                                      <p className="text-amber-400 font-bold flex items-center gap-1 uppercase tracking-widest text-[9px] mb-1">
                                        <Ruler className="w-3 h-3" /> Cubicación IA
                                      </p>
                                      <p className="text-slate-200 font-mono text-[10px] leading-relaxed bg-black/30 p-1.5 rounded border border-white/10 mb-1">{item.calculo_cubicacion}</p>
                                      {item.referencia_cubicacion && (
                                        <p className="text-slate-400 italic text-[9px] leading-tight">{item.referencia_cubicacion}</p>
                                      )}
                                    </div>
                                  )}
                                  {item.referencia_ia && (
                                    <div className="mb-3">
                                      <p className="text-emerald-400 font-bold flex items-center gap-1 uppercase tracking-widest text-[9px] mb-1">
                                        Auditoría IA
                                      </p>
                                      <p className="text-slate-200 italic leading-relaxed">{item.referencia_ia}</p>
                                    </div>
                                  )}
                                  {item.referencia && !item.referencia_cubicacion && (
                                    <div>
                                      <p className="text-indigo-400 font-bold uppercase tracking-widest text-[9px] mb-1">Fuente/Referencia</p>
                                      <p className="text-slate-300 italic">{item.referencia}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-600 text-xs">{typeof item.cantidad === 'number' ? formatQuantity(item.cantidad) : item.cantidad ?? '-'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-500 uppercase">{item.unit || item.unidad || '-'}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-xs text-slate-500 tabular-nums">{formatCurrency(item.precio_unitario || item.unit_price)}</td>
                          <td className="px-6 py-1.5 text-right font-bold text-slate-900 text-xs bg-emerald-50/20">{formatCurrency(itemTotal)}</td>
                          <td className="px-4 py-3 text-right min-w-[60px]">
                            <span className={`${getPercentageColor(pctOfPartida)} text-[9px] whitespace-nowrap`}>
                              {pctOfPartida > 0 ? pctOfPartida.toFixed(1) + '%' : '-'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-900 text-white">
                    <tr>
                      <td colSpan={4} className="px-10 py-8"></td>
                      <td className="px-4 py-8 text-right font-bold uppercase text-[10px] tracking-widest text-slate-400">Total Neto Consolidado</td>
                      <td className="px-6 py-8 text-right text-2xl font-black">{formatCurrency(analysis.resumen_consolidado?.total_neto || 0)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Tab: Detalle APU (NUEVO) */}
          <TabsContent value="apu" className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
            <Card className="rounded-[1.5rem] border-slate-200 p-5 bg-white shadow-sm">
              <div className="flex items-center gap-3 mb-6 sticky top-14 z-30 bg-white/80 backdrop-blur-md -mx-5 px-5 py-4 border-b border-slate-100 -mt-5 rounded-t-[1.5rem]">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <Search className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Análisis de Precios Unitarios (APU)</h2>
                  <p className="text-[11px] text-slate-400 font-medium">Desglose técnico de {editedApuData.filter((a: any) => !isPartida(a) && !a.is_title).length} partidas analizadas</p>
                </div>
                {isApuDirty && (
                  <Button 
                    onClick={handleSaveApu} 
                    disabled={isSavingApu}
                    className="ml-auto bg-slate-900 hover:bg-emerald-600 text-white font-bold py-2 px-6 rounded-full shadow-lg transition-all active:scale-95"
                  >
                    {isSavingApu ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Guardar cambios en DB
                  </Button>
                )}
              </div>

              {/* Contract Context Banner */}
              {(analysis.plazos?.duracion_minima_dias > 0 || analysis.plazos?.duracion_maxima_dias > 0) && (
                <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap gap-8 items-center justify-center animate-in fade-in zoom-in duration-500">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Clock className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plazo Mínimo</p>
                      <p className="text-sm font-bold text-slate-900">{analysis.plazos.duracion_minima_dias} días</p>
                    </div>
                  </div>
                  <div className="w-px h-8 bg-slate-200 hidden md:block" />
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plazo Máximo</p>
                      <p className="text-sm font-bold text-slate-900">{analysis.plazos.duracion_maxima_dias} días</p>
                    </div>
                  </div>
                  <div className="w-px h-8 bg-slate-200 hidden md:block" />
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Calendar className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duración Estimada</p>
                      <p className="text-sm font-bold text-slate-900">{analysis.plazos.duracion_total_dias || 0} días</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {editedApuData
                  .filter((apu: any) => !isPartida(apu) && !apu.is_title)
                  .map((apu: any, idx: number) => {
                    // Find actual index in source array for handleUpdateApuCell
                    const sourceIdx = editedApuData.findIndex(item => (item.item || item.codigo) === (apu.item || apu.codigo));
                  const totalApuUnitario = apu.precio_unitario_apu || apu.precio_unitario || 0;
                  const itemCode = apu.item || apu.codigo || '-';
                  const budgetQty = getBudgetQuantity(itemCode);
                  const totalApuGlobal = apu.total_apu || (totalApuUnitario * (budgetQty || 1));

                  const renderCategoryTable = (title: string, category: 'mano_obra' | 'maquinaria' | 'materiales') => {
                    const items = apu[category] || [];
                    const hasItems = items.length > 0;
                    return (
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-wider">{title}</h4>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleAddApuItem(sourceIdx, category)}
                            className="h-6 px-2 text-[9px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Añadir
                          </Button>
                        </div>
                        <div className="border-t border-b border-slate-900 overflow-hidden">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-900 bg-slate-50/50">
                                <th className="py-0.5 px-2 text-[8px] font-black uppercase tracking-widest text-slate-500 w-[45%]">Descripción</th>
                                <th className="py-0.5 px-2 text-[8px] font-black uppercase tracking-widest text-slate-500 text-center">Unidad</th>
                                <th className="py-0.5 px-2 text-[8px] font-black uppercase tracking-widest text-slate-500 text-center">Cantidad</th>
                                <th className="py-0.5 px-2 text-[8px] font-black uppercase tracking-widest text-slate-500 text-right">P. Unitario</th>
                                <th className="py-0.5 px-2 text-[8px] font-black uppercase tracking-widest text-slate-500 text-right">Total</th>
                                <th className="py-0.5 px-2 text-[8px] font-black uppercase tracking-widest text-slate-500 text-center w-8"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {hasItems ? (
                                  items.map((it: any, i: number) => (
                                    <ApuItemRow 
                                      key={i} 
                                      item={it} 
                                      formatCurrency={formatCurrency}
                                      onUpdate={(field, val) => handleUpdateApuCell(sourceIdx, category, i, field, val)}
                                      onRemove={() => handleRemoveApuItem(sourceIdx, category, i)}
                                      resourceList={resourceRegistry[category]}
                                    />
                                  ))
                              ) : (
                                <tr className="border-b border-slate-100 last:border-0">
                                  <td className="py-2 px-2 text-[9px] text-slate-400 italic text-center" colSpan={6}>
                                    Sin registros cargados
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  };

                  return (
                    <div key={idx} className="bg-white p-2 print:p-0">
                      {/* APU Header Box */}
                      <div className="border border-slate-900 p-2 mb-4">
                        <div className="grid grid-cols-[100px_1fr] gap-x-2 gap-y-0.5 text-[10px]">
                          <span className="font-bold">N° de Item</span>
                          <span>: {itemCode}</span>
                          <span className="font-bold">Partida</span>
                          <span>: {apu.nombre_partida || apu.descripcion_partida || apu.descripcion || 'Sin descripción'}</span>
                          <span className="font-bold">Unidad</span>
                          <span>: {apu.unidad || '-'}</span>
                          <span className="font-bold">Cantidad</span>
                          <span>: {budgetQty ? formatQuantity(budgetQty) : '1'}</span>
                        </div>
                      </div>

                      {/* APU Tables */}
                      {renderCategoryTable('A. MANO DE OBRA', 'mano_obra')}
                      {renderCategoryTable('B. MAQUINARIA', 'maquinaria')}
                      {renderCategoryTable('C. MATERIALES', 'materiales')}

                      {/* APU Unit Total Footer */}
                      <div className="mt-4 border-t border-slate-900 pt-2 flex justify-between items-baseline">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Precio Unitario</span>
                        <div className="flex gap-8 font-bold tabular-nums">
                          <span className="text-xs">{formatCurrency(totalApuUnitario).replace('$', '').trim()}</span>
                          <span className="text-xs text-slate-400">{formatCurrency(totalApuGlobal).replace('$', '').trim()}</span>
                        </div>
                      </div>

                      {/* Divider for next APU in the list */}
                      <div className="mt-8 mb-4 border-b border-dashed border-slate-200" />
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          {/* Tab: Especificaciones Técnicas (REDISEÑADO) */}
          <TabsContent value="especificaciones" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <Card className="rounded-[1rem] border-slate-200 p-4 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-indigo-50 rounded-2xl">
                  <ClipboardList className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Especificaciones Técnicas</h2>
              </div>
              <div className="grid gap-4">
                {especificacionesTecnicas.map((spec: any, idx: number) => (
                  <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-indigo-200 hover:shadow-lg transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-slate-900 group-hover:text-indigo-600">{spec.item || spec.nombre || spec.titulo || `Especificación ${idx + 1}`}</h4>
                      {spec.codigo && <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{spec.codigo}</span>}
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {safeRender(spec.descripcion || spec.especificacion || spec)}
                    </p>
                    {spec.requisitos && (
                      <div className="mt-3 p-3 bg-white/50 rounded-xl border border-indigo-50 text-[10px] text-indigo-600">
                        <span className="font-bold uppercase tracking-widest mr-2">Requisitos:</span>
                        {safeRender(spec.requisitos)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Tab: Materiales (REDISEÑADO) */}
          <TabsContent value="materiales" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <Card className="rounded-[1rem] border-slate-200 p-4 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-orange-50 rounded-2xl">
                  <Package className="w-6 h-6 text-orange-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Listado de Materiales</h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {materiales.map((mat: any, idx: number) => (
                  <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-orange-200 hover:shadow-lg transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
                        {idx + 1}
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{mat.unidad || mat.unit || 'UNIDAD'}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 mb-1 group-hover:text-orange-600">{mat.nombre || mat.descripcion}</h4>
                    <p className="text-2xl font-black text-slate-900">{mat.cantidad?.toLocaleString('es-CL') || '-'}</p>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Tab: Maquinaria y Equipo (REDISEÑADO con desglose APU) */}
          <TabsContent value="maquinaria" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {(() => {
              // Aggregate maquinaria from all APUs by equipment type
              const maqMap: Record<string, {
                descripcion: string;
                unidad: string;
                totalUsos: number;
                totalCosto: number;
                items: { item: string; descripcion: string; cantidad: number; pu: number; subtotal: number }[];
              }> = {};

              editedApuData.forEach((apu: any) => {
                if (apu.is_title || !apu.maquinaria?.length) return;
                const itemCode = apu.item || apu.codigo || '';
                const itemDesc = apu.descripcion || itemCode;

                apu.maquinaria.forEach((maq: any) => {
                  const key = (maq.descripcion || maq.d || maq.nombre || 'Equipo').trim();
                  if (!maqMap[key]) {
                    maqMap[key] = {
                      descripcion: key,
                      unidad: maq.unidad || maq.u || 'Hr',
                      totalUsos: 0,
                      totalCosto: 0,
                      items: []
                    };
                  }
                  const qty = parseFloat(maq.cantidad || maq.q || 0);
                  const pu = parseFloat(maq.precio_unitario || maq.pu || 0);
                  const subtotal = qty * pu;
                  maqMap[key].totalUsos += qty;
                  maqMap[key].totalCosto += subtotal;
                  maqMap[key].items.push({ item: itemCode, descripcion: itemDesc, cantidad: qty, pu, subtotal });
                });
              });

              const maqEntries = Object.values(maqMap).sort((a, b) => b.totalCosto - a.totalCosto);

              return (
                <>
                  {maqEntries.length > 0 ? (
                    <Card className="rounded-[2.5rem] border-slate-200 p-8 bg-white shadow-sm overflow-hidden">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-amber-50 rounded-2xl">
                          <Truck className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">Maquinaria — Desglose APU</h3>
                          <p className="text-xs text-slate-400 mt-0.5">Calculado desde los APUs de cada ítem</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {maqEntries.map((entry, idx) => (
                          <details key={idx} className="group rounded-2xl border border-slate-100 bg-slate-50 overflow-hidden">
                            <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-amber-50/30 transition-all list-none">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                                  <span className="text-amber-700 font-black text-sm">{entry.items.length}</span>
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-900">{entry.descripcion}</h4>
                                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                    {entry.totalUsos.toFixed(2)} {entry.unidad} · {formatCurrency(entry.totalCosto)}
                                  </p>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider group-open:hidden">Ver ítems ▼</span>
                              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider hidden group-open:block">Ocultar ▲</span>
                            </summary>
                            <div className="border-t border-slate-100 divide-y divide-slate-100">
                              {entry.items.map((uso, uidx) => (
                                <div key={uidx} className="flex items-center justify-between px-6 py-3 bg-white text-sm">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono font-bold text-slate-500 flex-shrink-0">{uso.item}</span>
                                    <span className="text-slate-600 truncate">{uso.descripcion}</span>
                                  </div>
                                  <div className="flex items-center gap-6 flex-shrink-0 ml-4 text-right">
                                    <div>
                                      <span className="font-bold text-slate-800">{uso.cantidad.toFixed(3)}</span>
                                      <span className="text-xs text-slate-400 ml-1">{entry.unidad}</span>
                                    </div>
                                    <div>
                                      <span className="font-bold text-slate-800">{formatCurrency(uso.pu)}</span>
                                      <span className="text-xs text-slate-400 ml-1">/{entry.unidad.toLowerCase()}</span>
                                    </div>
                                    <span className="font-black text-slate-900 w-24">{formatCurrency(uso.subtotal)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </details>
                        ))}
                      </div>
                    </Card>
                  ) : (
                    <Card className="rounded-[2.5rem] border-slate-200 p-12 bg-white shadow-sm flex flex-col items-center justify-center text-center">
                      <div className="p-4 bg-amber-50 rounded-2xl mb-4">
                        <Truck className="w-8 h-8 text-amber-300" />
                      </div>
                      <p className="text-slate-400 font-medium">No se detectó maquinaria en los APUs</p>
                    </Card>
                  )}

                  {equipamientoObra.length > 0 && (
                    <Card className="rounded-[1rem] border-slate-200 p-6 bg-white shadow-sm overflow-hidden">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-yellow-50 rounded-2xl">
                          <Settings2 className="w-6 h-6 text-yellow-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Equipamiento de Obra</h3>
                      </div>
                      <div className="grid gap-3">
                        {equipamientoObra.map((eq: any, idx: number) => (
                          <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center hover:bg-white transition-all">
                            <span className="font-medium text-slate-700 text-sm">{eq.nombre || eq.descripcion}</span>
                            <span className="text-xs font-bold text-slate-400">{eq.cantidad} {eq.unidad}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </>
              );
            })()}
          </TabsContent>

          {/* Tab: Profesionales y Mano de Obra (REDISEÑADO) */}
          <TabsContent value="profesionales" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <Card className="rounded-[1rem] border-slate-200 p-4 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 mb-10">
                <div className="p-3 bg-purple-50 rounded-2xl">
                  <Briefcase className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Staff Profesional Exigido</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {profesionalesRequeridos.map((prof: any, idx: number) => (
                  <div key={idx} className="p-8 rounded-[2rem] border border-slate-100 bg-slate-50 hover:bg-white hover:border-purple-200 hover:shadow-xl transition-all group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="h-12 w-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                        <HardHat className="w-6 h-6" />
                      </div>
                      <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {prof.categoria || 'Staff'}
                      </span>
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-purple-600 transition-colors">{prof.cargo || prof.nombre}</h4>
                    {prof.experiencia && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Experiencia Requerida</p>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed bg-white p-4 rounded-xl border border-slate-50">
                          {prof.experiencia}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* APU-based labor breakdown */}
            {(() => {
              // Aggregate mano_obra from all APUs by worker type
              const laborMap: Record<string, {
                descripcion: string;
                unidad: string;
                totalHoras: number;
                totalCosto: number;
                usos: { item: string; descripcion: string; cantidad: number; pu: number; subtotal: number }[];
              }> = {};

              editedApuData.forEach((apu: any) => {
                if (apu.is_title || !apu.mano_obra?.length) return;
                const itemCode = apu.item || apu.codigo || '';
                const itemDesc = apu.descripcion || itemCode;

                apu.mano_obra.forEach((mo: any) => {
                  const key = (mo.descripcion || mo.d || mo.nombre || 'Personal').trim();
                  if (!laborMap[key]) {
                    laborMap[key] = {
                      descripcion: key,
                      unidad: mo.unidad || mo.u || 'Día',
                      totalHoras: 0,
                      totalCosto: 0,
                      usos: []
                    };
                  }
                  const qty = parseFloat(mo.cantidad || mo.q || 0);
                  const pu = parseFloat(mo.precio_unitario || mo.pu || 0);
                  const subtotal = qty * pu;
                  laborMap[key].totalHoras += qty;
                  laborMap[key].totalCosto += subtotal;
                  laborMap[key].usos.push({
                    item: itemCode,
                    descripcion: itemDesc,
                    cantidad: qty,
                    pu,
                    subtotal
                  });
                });
              });

              const laborEntries = Object.values(laborMap).sort((a, b) => b.totalCosto - a.totalCosto);

              if (!laborEntries.length) return null;

              return (
                <Card className="rounded-[2.5rem] border-slate-200 p-8 bg-white shadow-sm overflow-hidden mt-8">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-indigo-50 rounded-2xl">
                      <Users className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Mano de Obra — Desglose APU</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Calculado desde los APUs de cada ítem</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {laborEntries.map((entry, idx) => {
                      return (
                        <details key={idx} className="group rounded-2xl border border-slate-100 bg-slate-50 overflow-hidden">
                          <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-white transition-all list-none">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-indigo-700 font-black text-sm">{entry.usos.length}</span>
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900">{entry.descripcion}</h4>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                  {entry.totalHoras.toFixed(2)} {entry.unidad} · {formatCurrency(entry.totalCosto)}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider group-open:hidden">
                              Ver ítems ▼
                            </span>
                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider hidden group-open:block">
                              Ocultar ▲
                            </span>
                          </summary>
                          <div className="border-t border-slate-100 divide-y divide-slate-100">
                            {entry.usos.map((uso, uidx) => (
                              <div key={uidx} className="flex items-center justify-between px-6 py-3 bg-white text-sm">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono font-bold text-slate-500 flex-shrink-0">{uso.item}</span>
                                  <span className="text-slate-600 truncate">{uso.descripcion}</span>
                                </div>
                                <div className="flex items-center gap-6 flex-shrink-0 ml-4 text-right">
                                  <div>
                                    <span className="font-bold text-slate-800">{uso.cantidad.toFixed(3)}</span>
                                    <span className="text-xs text-slate-400 ml-1">{entry.unidad}</span>
                                  </div>
                                  <div>
                                    <span className="font-bold text-slate-800">{formatCurrency(uso.pu)}</span>
                                    <span className="text-xs text-slate-400 ml-1">/{entry.unidad.toLowerCase()}</span>
                                  </div>
                                  <span className="font-black text-slate-900 w-24">{formatCurrency(uso.subtotal)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>
                      );
                    })}
                  </div>
                </Card>
              );
            })()}
          </TabsContent>


          {/* Tab: Señalética y Seguridad (REDISEÑADO) */}
          <TabsContent value="senaletica" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Señalética */}
              <Card className="rounded-[2.5rem] border-slate-200 overflow-hidden bg-white shadow-sm flex flex-col">
                <div className="p-8 border-b border-slate-100 bg-yellow-50/30 flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 rounded-2xl">
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Señalética de Obra</h3>
                </div>
                <div className="flex-1 p-8">
                  {senaletica.length > 0 ? (
                    <div className="space-y-4">
                      {senaletica.map((item: any, idx: number) => (
                        <div key={idx} className="p-5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-yellow-50/50 hover:border-yellow-200 transition-all flex justify-between items-center group">
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900 group-hover:text-yellow-700">{item.tipo || 'Señal'}</h4>
                            <p className="text-xs text-slate-500 mt-1">{item.descripcion || item.especificaciones || 'Requisito normativo'}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-black text-slate-900">{item.cantidad || '-'}</span>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Und.</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                      <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
                      <p className="font-medium">No se detectó señalética específica</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Seguridad */}
              <Card className="rounded-[2.5rem] border-slate-200 overflow-hidden bg-white shadow-sm flex flex-col">
                <div className="p-8 border-b border-slate-100 bg-red-50/30 flex items-center gap-4">
                  <div className="p-3 bg-red-100 rounded-2xl">
                    <Shield className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Seguridad y Prevención</h3>
                </div>
                <div className="flex-1 p-8">
                  {seguridadObra.length > 0 ? (
                    <div className="grid gap-3">
                      {seguridadObra.map((item: any, idx: number) => (
                        <div key={idx} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-start gap-4 hover:shadow-lg transition-all hover:-translate-y-1">
                          <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                          <div>
                            <h4 className="font-bold text-slate-900">{safeRender(item.item || item.descripcion)}</h4>
                            {item.requisitos && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{safeRender(item.requisitos)}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                      <Shield className="w-12 h-12 mb-4 opacity-20" />
                      <p className="font-medium">Protocolos generales de seguridad MOP</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Requisitos y Garantías */}
          <TabsContent value="requisitos" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {requisitosTecnicos.length > 0 && (
                <Card className="rounded-[1rem] border-slate-200 p-4 bg-white shadow-sm overflow-hidden">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-teal-50 rounded-2xl">
                      <FileCheck className="w-6 h-6 text-teal-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Requisitos Técnicos</h3>
                  </div>
                  <div className="space-y-4">
                    {requisitosTecnicos.map((req: any, idx: number) => (
                      <div key={idx} className="flex items-start bg-slate-50 p-5 rounded-2xl border border-slate-100 group hover:border-teal-200 transition-all">
                        <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-bold mr-4 flex-shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                          {idx + 1}
                        </div>
                        <span className="text-slate-700 font-medium">{safeRender(req)}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {garantias.length > 0 && (
                <Card className="rounded-[1rem] border-slate-200 p-4 bg-white shadow-sm overflow-hidden">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-blue-50 rounded-2xl">
                      <Shield className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Garantías Exigidas</h3>
                  </div>
                  <div className="grid gap-4">
                    {garantias.map((gar: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-6 hover:shadow-lg hover:shadow-blue-100/30 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-bold text-slate-900 group-hover:text-blue-600">{gar.tipo || 'Garantía'}</h4>
                          {gar.monto && <span className="text-xl font-black text-blue-600">{formatCurrency(gar.monto)}</span>}
                        </div>
                        {gar.duracion && <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Plazo: {gar.duracion}</p>}
                        {gar.descripcion && <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-200 pt-3">{gar.descripcion}</p>}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Tab: Normativas */}
          <TabsContent value="normativas" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <Card className="rounded-[2.5rem] border-slate-200 p-10 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 mb-10">
                <div className="p-3 bg-rose-50 rounded-2xl">
                  <BookOpen className="w-6 h-6 text-rose-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Normativas Aplicables</h2>
              </div>
              {normativas.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {normativas.map((norm: any, idx: number) => (
                    <div key={idx} className="bg-slate-50 border border-slate-100 p-6 rounded-2xl hover:border-rose-200 hover:shadow-lg transition-all group">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-2 h-2 rounded-full bg-rose-400" />
                        <h4 className="font-bold text-slate-900 group-hover:text-rose-600">
                          {norm.codigo && <span className="text-rose-500 mr-2">[{norm.codigo}]</span>}
                          {safeRender(norm.nombre || norm)}
                        </h4>
                      </div>
                      {norm.descripcion && <p className="text-xs text-slate-500 leading-relaxed mb-4">{norm.descripcion}</p>}
                      {norm.cumplimiento && (
                        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Exigencia</span>
                          <span className="text-[10px] font-black text-rose-600 uppercase bg-rose-50 px-2 py-0.5 rounded-full">{norm.cumplimiento}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-slate-300">
                  <BookOpen className="w-16 h-16 mb-6 opacity-20" />
                  <p className="text-lg font-medium">Normativas generales vigentes MOP</p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Tab: Plazos */}
          <TabsContent value="plazos" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <Card className="rounded-[2.5rem] border-slate-200 p-10 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 mb-10">
                <div className="p-3 bg-cyan-50 rounded-2xl">
                  <Clock className="w-6 h-6 text-cyan-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Cronograma del Proyecto</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <div className="bg-cyan-600 p-8 rounded-[2rem] text-white shadow-xl shadow-cyan-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl group-hover:scale-125 transition-transform" />
                  <p className="text-cyan-100 text-xs font-bold uppercase tracking-widest mb-2">Plazo de Ejecución</p>
                  <div className="text-5xl font-black">{plazos.duracion_total_dias || 0}</div>
                  <p className="text-cyan-100 font-bold">Días Corridos</p>
                </div>

                {plazos.fecha_inicio && (
                  <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 flex flex-col justify-center">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Inicio Estimado</p>
                    <p className="text-2xl font-black text-slate-900">{plazos.fecha_inicio}</p>
                  </div>
                )}

                {plazos.fecha_termino && (
                  <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 flex flex-col justify-center">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Fin Estimado</p>
                    <p className="text-2xl font-black text-slate-900">{plazos.fecha_termino}</p>
                  </div>
                )}
              </div>

              {(plazos.etapas?.length || 0) > 0 && (
                <div className="space-y-6">
                  <h4 className="text-lg font-bold text-slate-900 ml-2">Etapas y Actividades</h4>
                  <div className="grid gap-3">
                    {plazos.etapas.map((etapa: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-2 h-2 rounded-full bg-cyan-400" />
                          <div>
                            <span className="font-bold text-slate-900">{etapa.nombre || `Fase ${idx + 1}`}</span>
                            {etapa.actividades && <p className="text-xs text-slate-400 mt-0.5">{etapa.actividades}</p>}
                          </div>
                        </div>
                        <span className="px-4 py-1.5 bg-cyan-50 text-cyan-600 rounded-full font-bold text-sm tracking-tight">
                          {etapa.duracion_dias} días
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Tab: Estrategia (REDISEÑADO) */}
          <TabsContent value="estrategia" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="rounded-[2.5rem] border-none bg-emerald-600 text-white p-10 shadow-xl shadow-emerald-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-125 transition-transform" />
                <FileCheck className="w-10 h-10 mb-6 text-emerald-200" />
                <h3 className="text-2xl font-extrabold mb-6">Ventajas Competitivas</h3>
                <ul className="space-y-4">
                  {analisisEstrategico.ventajas?.map((v: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                      <div className="w-1.5 h-1.5 bg-emerald-300 rounded-full mt-2" />
                      <span className="text-sm font-medium leading-relaxed">{v}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="rounded-[2.5rem] border-none bg-rose-600 text-white p-10 shadow-xl shadow-rose-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-125 transition-transform" />
                <AlertTriangle className="w-10 h-10 mb-6 text-rose-200" />
                <h3 className="text-2xl font-extrabold mb-6">Puntos Críticos (Dolores)</h3>
                <ul className="space-y-4">
                  {analisisEstrategico.dolores?.map((d: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                      <div className="w-1.5 h-1.5 bg-rose-300 rounded-full mt-2" />
                      <span className="text-sm font-medium leading-relaxed">{d}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            <Card className="rounded-[2.5rem] bg-white border border-slate-200 p-10 text-center shadow-sm">
              <div className="max-w-3xl mx-auto">
                <Clock className="w-12 h-12 text-blue-500 mx-auto mb-6" />
                <h4 className="text-xl font-bold text-slate-900 mb-4">Análisis de Tiempos y Factibilidad</h4>
                <p className="text-slate-600 text-lg leading-relaxed italic">
                  “{analisisEstrategico.evaluacion_tiempo || "El proyecto presenta una estructura de plazos coherente con los requisitos MOP detectados."}”
                </p>
              </div>
            </Card>
          </TabsContent>

          {/* Tab: Riesgos (REDISEÑADO) */}
          <TabsContent value="riesgos" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <Card className="rounded-[2.5rem] border-slate-200 p-10 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 mb-10">
                <div className="p-3 bg-red-50 rounded-2xl">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Matriz de Riesgos Identificados</h2>
              </div>
              {riesgos.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {riesgos.map((riesgo: any, idx: number) => (
                    <div key={idx} className="bg-slate-50 border border-slate-100 p-6 rounded-[2rem] hover:shadow-xl hover:shadow-red-50 hover:bg-white transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-extrabold text-slate-900 group-hover:text-red-600 leading-tight">
                          {riesgo.descripcion || riesgo.nombre || riesgo}
                        </h4>
                        <div className="flex gap-2">
                          {riesgo.impacto && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-black uppercase rounded-lg">Impacto: {riesgo.impacto}</span>
                          )}
                        </div>
                      </div>

                      {riesgo.probabilidad && (
                        <div className="mb-4">
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                            <span>Probabilidad de Ocurrencia</span>
                            <span className="text-red-500">{riesgo.probabilidad}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 rounded-full" style={{ width: riesgo.probabilidad.includes('Alta') ? '90%' : riesgo.probabilidad.includes('Media') ? '50%' : '25%' }} />
                          </div>
                        </div>
                      )}

                      {riesgo.mitigacion && (
                        <div className="mt-6 pt-4 border-t border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Plan de Mitigación</p>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium bg-white p-3 rounded-xl border border-slate-50 italic">
                            “{riesgo.mitigacion}”
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-slate-300">
                  <AlertTriangle className="w-16 h-16 mb-6 opacity-20" />
                  <p className="text-lg font-medium">No se detectaron riesgos de alta criticidad</p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Tab: Tramos de Camino (REDISEÑADO) */}
          <TabsContent value="tramos" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <Card className="rounded-[1rem] border-slate-200 p-4 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-indigo-50 rounded-2xl">
                  <Ruler className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Segmentación de Tramos</h2>
              </div>
              {tramos.length > 0 ? (
                <div className="overflow-x-auto rounded-[1.5rem] border border-slate-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-widest text-[10px]">Identificador</th>
                        <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-widest text-[10px]">Ubicación / Comunidad</th>
                        <th className="px-6 py-4 text-right font-bold text-slate-400 uppercase tracking-widest text-[10px]">KM Inicial</th>
                        <th className="px-6 py-4 text-right font-bold text-slate-400 uppercase tracking-widest text-[10px]">KM Final</th>
                        <th className="px-6 py-4 text-right font-bold text-slate-400 uppercase tracking-widest text-[10px]">Longitud</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {tramos.map((tramo: any, idx: number) => (
                        <tr key={idx} className="hover:bg-indigo-50/30 transition-colors group">
                          <td className="px-6 py-4 font-mono text-indigo-600 font-bold">{tramo.camino_id || '-'}</td>
                          <td className="px-6 py-4 text-slate-600 font-medium">{tramo.comunidad || '-'}</td>
                          <td className="px-6 py-4 text-right text-slate-500">{tramo.km_inicio ?? '-'}</td>
                          <td className="px-6 py-4 text-right text-slate-500">{tramo.km_termino ?? '-'}</td>
                          <td className="px-6 py-4 text-right">
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-black">{tramo.longitud_m ?? '-'} m</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                  <Ruler className="w-12 h-12 mb-4 opacity-20" />
                  <p className="font-medium">No se detectaron tramos específicos</p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Tab: Cubicaciones (REDISEÑADO) */}
          <TabsContent value="cubicaciones" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <Card className="rounded-[1rem] border-slate-200 p-4 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-blue-50 rounded-2xl">
                  <Settings2 className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Cuadro de Cubicaciones</h2>
              </div>
              {cubicaciones.length > 0 ? (
                <div className="overflow-x-auto rounded-[1.5rem] border border-slate-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-widest text-[10px]">Item</th>
                        <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-widest text-[10px]">Descripción Técnica</th>
                        <th className="px-6 py-4 text-right font-bold text-slate-400 uppercase tracking-widest text-[10px]">Cantidad</th>
                        <th className="px-6 py-4 text-center font-bold text-slate-400 uppercase tracking-widest text-[10px]">Unidad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {cubicaciones.map((cub: any, idx: number) => (
                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="px-3 py-2 font-mono text-blue-600 font-black">{cub.codigo_item || cub.codigo || '-'}</td>
                          <td className="px-3 py-2 text-slate-600 text-sm leading-tight flex flex-col justify-center">{cub.descripcion || '-'}</td>
                          <td className="px-3 py-2 text-right font-black text-slate-900">{typeof cub.cantidad === 'number' ? cub.cantidad.toLocaleString('es-CL') : cub.cantidad ?? '-'}</td>
                          <td className="px-3 py-2 text-center font-bold text-slate-400 uppercase tracking-tighter text-xs">{cub.unidad || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-400 text-center py-20 font-medium italic">No se identificaron cubicaciones detalladas.</p>
              )}
            </Card>
          </TabsContent>

          {/* Tab: Comunidades y Participación (REDISEÑADO) */}
          <TabsContent value="comunidades" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {typeof participacionCiudadana === 'object' && !Array.isArray(participacionCiudadana) && (
                <Card className="rounded-[1rem] border-slate-200 p-4 bg-white shadow-sm overflow-hidden">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-blue-50 rounded-2xl">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Plan de Participación</h3>
                  </div>
                  <div className="space-y-6">
                    {participacionCiudadana.objetivo_general && (
                      <p className="text-slate-600 leading-relaxed font-medium bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        {participacionCiudadana.objetivo_general}
                      </p>
                    )}
                    <div className="grid gap-4">
                      {participacionCiudadana.actividades_minimas?.map((act: string, i: number) => (
                        <div key={i} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                          <span className="text-xs font-medium text-slate-700">{act}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {Array.isArray(comunidades) && comunidades.length > 0 && (
                <Card className="rounded-[1rem] border-slate-200 p-4 bg-white shadow-sm overflow-hidden">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-purple-50 rounded-2xl">
                      <MapPin className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Comunidades</h3>
                  </div>
                  <div className="grid gap-4">
                    {comunidades.map((com: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl hover:border-purple-200 transition-all flex justify-between items-center group">
                        <div>
                          <h4 className="font-bold text-slate-900 group-hover:text-purple-600">{typeof com === 'string' ? com : com.nombre}</h4>
                          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">Ubicación: {com.ubicacion || 'General'}</p>
                        </div>
                        <Users className="w-5 h-5 text-slate-200 group-hover:text-purple-300" />
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {((consideracionesIndigenas as any).acciones_requeridas?.length > 0) && (
              <Card className="rounded-[2.5rem] border-none bg-indigo-900 text-white p-10 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                    <Shield className="w-6 h-6 text-indigo-300" />
                  </div>
                  <h3 className="text-2xl font-bold">Protocolo Indígena (Convenio 169)</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {(consideracionesIndigenas as any).acciones_requeridas.map((acc: string, i: number) => (
                    <div key={i} className="bg-white/5 p-5 rounded-2xl border border-white/5 backdrop-blur-md flex items-start gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2" />
                      <span className="text-sm font-medium text-indigo-100 leading-relaxed">{acc}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Documentos (REDISEÑADO) */}
          <TabsContent value="documentos" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <Card className="rounded-[1rem] border-slate-200 p-4 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-slate-50 rounded-2xl">
                  <Package className="w-6 h-6 text-slate-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Expediente Digital</h2>
              </div>
              <div className="grid gap-4">
                {(documentosInfo.length > 0 ? documentosInfo : archivos).map((doc: any, idx: number) => (
                  <div key={idx} className="border border-slate-100 rounded-[2rem] overflow-hidden group hover:border-blue-200 transition-all">
                    <button
                      onClick={() => setExpandedDoc(expandedDoc === idx ? null : idx)}
                      className="w-full flex items-center justify-between p-6 bg-slate-50 group-hover:bg-white transition-all text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-blue-500">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{doc.nombre_limpio || doc.metadata?.filename || `Documento ${idx + 1}`}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{doc.tipo || 'ANEXO TÉCNICO'}</p>
                        </div>
                      </div>
                      {expandedDoc === idx ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </button>
                    {expandedDoc === idx && (
                      <div className="p-8 bg-white border-t border-slate-50 animate-in slide-in-from-top-2 duration-300">
                        <div className="prose prose-slate max-w-none mb-8">
                          <p className="text-slate-600 leading-relaxed font-medium">{doc.resumen || doc.documento?.resumen}</p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8">
                          <div>
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Puntos Clave</h5>
                            <div className="space-y-2">
                              {(doc.puntos_clave || doc.documento?.puntos_clave || []).map((p: string, i: number) => (
                                <div key={i} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2" />
                                  {p}
                                </div>
                              ))}
                            </div>
                          </div>
                          {(doc.aspectos_criticos || doc.documento?.aspectos_criticos || []).length > 0 && (
                            <div>
                              <h5 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-4">Alertas Críticas</h5>
                              <div className="space-y-2">
                                {(doc.aspectos_criticos || doc.documento?.aspectos_criticos || []).map((a: string, i: number) => (
                                  <div key={i} className="flex items-start gap-3 text-sm text-red-600 font-bold bg-red-50 p-3 rounded-xl border border-red-100">
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    {a}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Tab: Propuesta Económica (Simulador) */}
          {/* Tab: Referencias y Justificaciones */}
          <TabsContent value="referencias" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <Card className="rounded-[2.5rem] border-slate-200 overflow-hidden bg-white shadow-sm">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-2xl">
                    <Search className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Referencias de Análisis</h2>
                    <p className="text-sm text-slate-400 font-medium">Fuentes y justificaciones de valores extraídos</p>
                  </div>
                </div>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 w-24 text-center">Ítem</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Descripción / Partida</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Referencia / Fuente del Dato</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(itemsPresupuesto || []).map((item: any, idx: number) => {
                      const isPartidaItem = isPartida(item);
                      return (
                        <tr key={idx} className={`group hover:bg-slate-50/80 transition-colors ${isPartidaItem ? 'bg-slate-50/30 font-bold' : ''}`}>
                          <td className="px-6 py-4 text-sm text-slate-500 border-b border-slate-100 text-center font-mono">{item.item || item.codigo}</td>
                          <td className="px-6 py-4 text-sm text-slate-900 border-b border-slate-100">
                            {item.descripcion}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 border-b border-slate-100 italic bg-blue-50/30">
                            {item.referencia ? (
                              <div className="flex items-start gap-2">
                                <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400" />
                                <span>{item.referencia}</span>
                              </div>
                            ) : (
                              <span className="text-slate-300">Sin referencia detallada</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="propuesta" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Header: Controls */}
            <Card className="rounded-[2rem] border-slate-200 p-6 bg-white shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-50 rounded-2xl">
                    <Settings2 className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Simulador de Oferta</h3>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ajuste Global + Individual por Ítem</p>
                  </div>
                </div>

                <div className="flex-1 max-w-md space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Margen Global de Oferta</label>
                    <div className="flex items-center gap-2">
                      <span className={`text-xl font-black ${margin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {margin > 0 ? '+' : ''}{margin}%
                      </span>
                      {margin !== 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setMargin(0);
                            setItemMargins({});
                          }}
                          className="h-6 px-2 text-[10px] font-bold text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full"
                        >
                          Reset 0%
                        </Button>
                      )}
                    </div>
                  </div>
                  <SmoothSlider
                    value={margin}
                    min={-15}
                    max={15}
                    onChange={setMargin}
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-300">
                    <span>-15%</span>
                    <span className="text-slate-400">0%</span>
                    <span>+15%</span>
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 min-w-[240px]">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Ofertado (Neto)</p>
                  <p className="text-2xl font-black text-orange-600">
                    {formatCurrency((() => {
                      let total = 0;
                      sortedItems.forEach((item: any, idx: number) => {
                        const unitPriceRef = item.precio_unitario || item.unit_price || 0;
                        const quantity = typeof item.cantidad === 'number' ? item.cantidad : parseFloat(item.cantidad?.toString().replace(/\./g, '').replace(',', '.') || '0');
                        const itemMargin = itemMargins[idx] ?? margin;
                        total += unitPriceRef * (1 + itemMargin / 100) * quantity;
                      });
                      return total;
                    })())}
                  </p>
                </div>
              </div>
            </Card>

            {/* Table Section: Full Width */}
            <Card className="rounded-[2rem] border-slate-200 p-0 overflow-hidden bg-white shadow-sm">
              <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-6 bg-orange-500 rounded-full" />
                  <h4 className="font-bold text-slate-900">Desglose de Partidas (Borrador)</h4>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">
                    {sortedItems.length} Ítems Detectados
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newMargins: Record<number, number> = {};
                      sortedItems.forEach((_: any, idx: number) => { newMargins[idx] = 0; });
                      setItemMargins(newMargins);
                      setMargin(0);
                    }}
                    className="text-[10px] text-slate-400 hover:text-slate-600"
                  >
                    Resetear Márgenes
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-16">Item</th>
                      <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Designación</th>
                      <th className="px-3 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-14">Und.</th>
                      <th className="px-3 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right w-20">Cant.</th>
                      <th className="px-3 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right w-24">P.U. Ref.</th>
                      <th className="px-2 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-32 bg-orange-50/30 text-orange-700">Margen Ítem</th>
                      <th className="px-3 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right w-24 bg-orange-50/30 text-orange-700">P.U. Oferta</th>
                      <th className="px-3 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right w-24">Total</th>
                      <th className="px-3 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right w-12">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {sortedItems.length > 0 ? (
                      (() => {
                        // Pre-calculate total for percentages (exclude partidas from total)
                        let grandTotal = 0;
                        sortedItems.forEach((item: any, idx: number) => {
                          if (isPartida(item)) return; // Skip partida titles
                          const unitPriceRef = item.precio_unitario || item.unit_price || 0;
                          const quantity = typeof item.cantidad === 'number' ? item.cantidad : parseFloat(item.cantidad?.toString().replace(/\./g, '').replace(',', '.') || '0');
                          const itemMargin = itemMargins[idx] ?? margin;
                          grandTotal += unitPriceRef * (1 + itemMargin / 100) * quantity;
                        });

                        return sortedItems.map((item: any, idx: number) => {
                          const partidaItem = isPartida(item);

                          // Partida title row — styled as a section header, no per-item values
                          if (partidaItem) {
                            // Use backend-computed subtotal (item.total) with oferta-adjusted fallback
                            const refSubtotal = (item.total && item.total > 0)
                              ? item.total
                              : getPartidaSubtotal(item, sortedItems);
                            // Apply average margin to give an estimate for the offer total
                            const avgMarginFactor = 1 + (margin / 100);
                            const offerSubtotal = refSubtotal * avgMarginFactor;
                            const pctOfTotal = grandTotal > 0 ? (offerSubtotal / grandTotal) * 100 : 0;
                            return (
                              <tr key={idx} className="bg-slate-100/80 border-t-2 border-slate-200">
                                <td className="px-4 py-3 text-xs font-black text-slate-500">{item.codigo || item.item || ''}</td>
                                <td className="px-4 py-3 text-xs font-black text-slate-800 uppercase tracking-wide" colSpan={5}>
                                  {item.descripcion || item.nombre || item.designacion}
                                </td>
                                <td className="px-4 py-3 text-right text-xs font-black text-slate-800">
                                  {offerSubtotal > 0 ? formatCurrency(offerSubtotal) : ''}
                                </td>
                                <td className="px-3 py-3 text-right">
                                  <span className="font-black text-slate-600 text-[10px]">
                                    {pctOfTotal > 0 ? pctOfTotal.toFixed(1) + '%' : '-'}
                                  </span>
                                </td>
                              </tr>
                            );
                          }

                          const unitPriceRef = item.precio_unitario || item.unit_price || 0;
                          const quantity = typeof item.cantidad === 'number' ? item.cantidad : parseFloat(item.cantidad?.toString().replace(/\./g, '').replace(',', '.') || '0');
                          const itemMargin = itemMargins[idx] ?? margin;
                          const unitPriceOffer = unitPriceRef * (1 + itemMargin / 100);
                          const totalOffer = unitPriceOffer * quantity;
                          const pct = grandTotal > 0 ? (totalOffer / grandTotal) * 100 : 0;

                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-4 py-3 text-xs font-bold text-slate-400">{item.codigo || item.item || '-'}</td>
                              <td className="px-4 py-3 text-xs font-bold text-slate-700 max-w-[200px]" title={item.descripcion || item.nombre || item.designacion}>
                                <span className="line-clamp-2">{item.descripcion || item.nombre || item.designacion}</span>
                              </td>
                              <td className="px-3 py-3 text-xs font-semibold text-slate-500">{item.unidad || item.unit || '-'}</td>
                              <td className="px-3 py-3 text-xs font-bold text-slate-900 text-right">
                                {formatQuantity(quantity)}
                              </td>
                              <td className="px-3 py-3 text-xs font-medium text-slate-400 text-right">
                                {formatCurrency(unitPriceRef)}
                              </td>
                              <td className="px-2 py-1 bg-orange-50/10">
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className={`text-[10px] font-black ${itemMargin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {itemMargin > 0 ? '+' : ''}{itemMargin.toFixed(1)}%
                                  </span>
                                  <SmoothSlider
                                    value={itemMargin}
                                    min={-30}
                                    max={30}
                                    onChange={(v) => setItemMargins(prev => ({ ...prev, [idx]: v }))}
                                    className="[&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3"
                                  />
                                </div>
                              </td>
                              <td className="px-3 py-3 text-xs font-black text-orange-600 text-right bg-orange-50/10">
                                {formatCurrency(unitPriceOffer)}
                              </td>
                              <td className="px-3 py-3 text-xs font-black text-slate-900 text-right">
                                {formatCurrency(totalOffer)}
                              </td>
                              <td className={`px-3 py-3 text-[10px] text-right ${getPercentageColor(pct)}`}>
                                {pct.toFixed(1)}%
                              </td>
                            </tr>
                          );
                        });
                      })()
                    ) : (
                      <tr>
                        <td colSpan={9} className="px-6 py-12 text-center text-slate-400 italic">
                          No se detectaron partidas detalladas en el análisis.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Bottom Bar: Vista Previa + Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="md:col-span-2 rounded-[2rem] border-none bg-slate-900 text-white p-6 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-orange-500/20 transition-all duration-700" />
                <div className="relative z-10 flex items-center justify-between gap-6">
                  <div className="flex-1">
                    <h4 className="text-sm font-black uppercase tracking-widest text-orange-400 mb-2">Vista Previa de Informe</h4>
                    <p className="text-[10px] text-slate-400 font-serif italic leading-relaxed">
                      "Habiendo visitado el sitio y revisado los planos... ofrecemos construir y terminar la totalidad de dichas obras por la suma de {formatCurrency((() => {
                        let total = 0;
                        sortedItems.forEach((item: any, idx: number) => {
                          const unitPriceRef = item.precio_unitario || item.unit_price || 0;
                          const quantity = typeof item.cantidad === 'number' ? item.cantidad : parseFloat(item.cantidad?.toString().replace(/\./g, '').replace(',', '.') || '0');
                          const itemMargin = itemMargins[idx] ?? margin;
                          total += unitPriceRef * (1 + itemMargin / 100) * quantity;
                        });
                        return total;
                      })())}..."
                    </p>
                  </div>
                  <Button
                    onClick={() => handleExport('xlsx')}
                    disabled={isExporting}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl px-8 py-6 shadow-lg shadow-orange-500/20 flex items-center gap-2 shrink-0"
                  >
                    {isExporting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Download className="w-5 h-5" />
                    )}
                    <span>Generar Informe</span>
                  </Button>
                </div>
              </Card>

              <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">IA Insight</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed font-semibold">
                  Tu oferta de <span className="text-emerald-900 font-black">{margin}%</span> se encuentra dentro del rango sugerido basado en la complejidad de los tramos detectados.
                </p>
              </div>
            </div>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
}
