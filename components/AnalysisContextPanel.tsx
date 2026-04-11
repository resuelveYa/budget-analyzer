'use client';

import React, { useState } from 'react';
import { type AnalysisContext } from '@/lib/api/budgetAnalyzerApi';
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';

interface AnalysisContextPanelProps {
  /** Called whenever the context values change, so the parent can include them in the analysis request */
  onChange: (context: AnalysisContext) => void;
}

/**
 * Optional collapsible panel shown just before the "Analizar" button.
 * Captures per-analysis context: ventaja competitiva, notas and experience flag.
 * All fields are optional — does NOT block the analysis.
 */
export default function AnalysisContextPanel({ onChange }: AnalysisContextPanelProps) {
  const [open, setOpen] = useState(false);
  const [ventaja, setVentaja] = useState('');
  const [notas, setNotas] = useState('');
  const [similares, setSimilares] = useState<boolean | undefined>(undefined);

  const notify = (patch: Partial<AnalysisContext>) => {
    const ctx: AnalysisContext = {
      ventaja_competitiva: ventaja,
      notas_proyecto: notas,
      proyectos_similares: similares,
      ...patch,
    };
    onChange(ctx);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-amber-50 rounded-lg">
            <Lightbulb className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              Contexto de este análisis <span className="text-slate-400 font-normal">(opcional)</span>
            </p>
            <p className="text-[10px] text-slate-400 font-medium">
              Añade ventajas o notas específicas para este proyecto
            </p>
          </div>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-slate-400" />
          : <ChevronDown className="w-4 h-4 text-slate-400" />
        }
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 py-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Ventaja competitiva */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">
              Ventaja competitiva para este proyecto
            </label>
            <textarea
              rows={2}
              value={ventaja}
              onChange={e => {
                setVentaja(e.target.value);
                notify({ ventaja_competitiva: e.target.value });
              }}
              placeholder="Ej: Tenemos maquinaria disponible de inmediato en la zona, conocemos los proveedores locales…"
              className="w-full text-sm rounded-xl border border-slate-200 p-3 resize-none focus:outline-none focus:ring-2 focus:ring-amber-200 text-slate-800 placeholder:text-slate-300"
            />
          </div>

          {/* Notas del proyecto */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">
              Notas específicas del proyecto
            </label>
            <textarea
              rows={2}
              value={notas}
              onChange={e => {
                setNotas(e.target.value);
                notify({ notas_proyecto: e.target.value });
              }}
              placeholder="Cualquier detalle que quieras que el análisis tome en cuenta…"
              className="w-full text-sm rounded-xl border border-slate-200 p-3 resize-none focus:outline-none focus:ring-2 focus:ring-amber-200 text-slate-800 placeholder:text-slate-300"
            />
          </div>

          {/* Proyectos similares */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">
              ¿Han ejecutado proyectos similares?
            </label>
            <div className="flex gap-3">
              {(['Sí', 'No'] as const).map(opt => {
                const val = opt === 'Sí';
                const active = similares === val;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setSimilares(val);
                      notify({ proyectos_similares: val });
                    }}
                    className={`px-5 py-2 rounded-xl text-xs font-bold border transition-all
                      ${active
                        ? 'bg-amber-50 border-amber-300 text-amber-700'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                  >
                    {opt}
                  </button>
                );
              })}
              {similares !== undefined && (
                <button
                  type="button"
                  onClick={() => {
                    setSimilares(undefined);
                    notify({ proyectos_similares: undefined });
                  }}
                  className="text-[10px] text-slate-400 hover:text-slate-600"
                >
                  limpiar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
