'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { budgetAnalyzerApi, type CompanyProfile } from '@/lib/api/budgetAnalyzerApi';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Building, MapPin, Truck, Star, AlertTriangle,
  ChevronDown, CheckSquare, Square, X, Loader2, Save
} from 'lucide-react';

const ESPECIALIDADES_OPTIONS = [
  'Pavimentación y bacheo',
  'Obras viales (MOP)',
  'Edificación pública',
  'Obras sanitarias',
  'Instalaciones eléctricas',
  'Señalética y demarcación',
  'Movimiento de tierras',
  'Estructuras metálicas',
  'Obras hidráulicas',
  'Paisajismo y áreas verdes',
  'Demolición y retiro escombros',
  'Mobiliario urbano',
] as const;

interface CompanyProfileFormProps {
  /** Called after a successful save so the parent can hide the modal */
  onSaved?: (profile: CompanyProfile) => void;
  /** Whether to show a dismiss button (only if not first-time required) */
  dismissible?: boolean;
  onDismiss?: () => void;
}

export default function CompanyProfileForm({
  onSaved,
  dismissible = false,
  onDismiss,
}: CompanyProfileFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{
    fortalezas: string;
    debilidades: string;
    ubicacion_oficinas: string;
    num_vehiculos: string;
    experiencia_anos: string;
    especialidades: string[];
    notas_adicionales: string;
  }>({
    fortalezas: '',
    debilidades: '',
    ubicacion_oficinas: '',
    num_vehiculos: '0',
    experiencia_anos: '0',
    especialidades: [],
    notas_adicionales: '',
  });

  // Load existing profile on mount
  useEffect(() => {
    (async () => {
      try {
        const profile = await budgetAnalyzerApi.getCompanyProfile();
        if (profile) {
          setForm({
            fortalezas: profile.fortalezas ?? '',
            debilidades: profile.debilidades ?? '',
            ubicacion_oficinas: profile.ubicacion_oficinas ?? '',
            num_vehiculos: String(profile.num_vehiculos ?? 0),
            experiencia_anos: String(profile.experiencia_anos ?? 0),
            especialidades: profile.especialidades ?? [],
            notas_adicionales: profile.notas_adicionales ?? '',
          });
        }
      } catch {
        // silently — first time user, form stays empty
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Add Escape key support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) {
        onDismiss?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dismissible, onDismiss]);

  const toggleEspecialidad = (item: string) => {
    setForm(prev => ({
      ...prev,
      especialidades: prev.especialidades.includes(item)
        ? prev.especialidades.filter(e => e !== item)
        : [...prev.especialidades, item],
    }));
  };

  const handleSave = useCallback(async () => {
    if (!form.fortalezas.trim() || !form.ubicacion_oficinas.trim()) {
      toast.error('Fortalezas y ubicación de oficinas son obligatorias');
      return;
    }

    try {
      setSaving(true);
      const saved = await budgetAnalyzerApi.saveCompanyProfile({
        fortalezas: form.fortalezas,
        debilidades: form.debilidades,
        ubicacion_oficinas: form.ubicacion_oficinas,
        num_vehiculos: Number(form.num_vehiculos) || 0,
        experiencia_anos: Number(form.experiencia_anos) || 0,
        especialidades: form.especialidades,
        notas_adicionales: form.notas_adicionales,
      });
      toast.success('Perfil de empresa guardado correctamente');
      onSaved?.(saved);
    } catch {
      toast.error('No se pudo guardar el perfil. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  }, [form, onSaved]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[99] bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    /* Full-screen overlay */
    <div className="fixed inset-0 z-[99] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-300">
      <div 
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto transform transition-all animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onKeyDown={e => e.stopPropagation()} // Prevent bubble to global listener if needed
      >

        {/* Dismiss button */}
        {dismissible && (
          <button
            onClick={onDismiss}
            className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors z-10"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        )}

        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-blue-950 rounded-t-3xl p-6 text-white text-center sm:text-left">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-8 -mt-8 blur-2xl" />
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-2">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
              <Building className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight leading-tight">Perfil de tu empresa</h2>
              <p className="text-blue-200/80 text-xs">
                Personaliza tus análisis para ganar más licitaciones
              </p>
            </div>
          </div>
          <div className="text-[9px] font-bold text-blue-300/40 uppercase tracking-[0.2em] mt-1">
            Solo toma un minuto — Podrás editarlo después
          </div>
        </div>

        <div className="p-6 space-y-5">

          {/* Fortalezas */}
          <div>
            <label className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
              <Star className="w-3.5 h-3.5 text-emerald-500" />
              Fortalezas del equipo
              <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={3}
              value={form.fortalezas}
              onChange={e => setForm(p => ({ ...p, fortalezas: e.target.value }))}
              placeholder="Ej: Experiencia en bacheo urbano, flota propia, equipo en terreno disponible inmediatamente…"
              className="w-full text-sm rounded-xl border border-slate-200 p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 text-slate-800 placeholder:text-slate-300"
            />
          </div>

          {/* Debilidades */}
          <div>
            <label className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Debilidades o limitaciones
            </label>
            <textarea
              rows={3}
              value={form.debilidades}
              onChange={e => setForm(p => ({ ...p, debilidades: e.target.value }))}
              placeholder="Ej: No tenemos experiencia en obras de gran envergadura, sin maquinaria pesada propia…"
              className="w-full text-sm rounded-xl border border-slate-200 p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 text-slate-800 placeholder:text-slate-300"
            />
          </div>

          {/* Ubicación y Vehículos en grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                <MapPin className="w-3 h-3 text-blue-500" />
                Oficinas <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.ubicacion_oficinas}
                onChange={e => setForm(p => ({ ...p, ubicacion_oficinas: e.target.value }))}
                placeholder="Ej: Santiago, RM"
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-100 text-slate-800 transition-all font-medium"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                <Truck className="w-3 h-3 text-orange-400" />
                Vehículos
              </label>
              <input
                type="number"
                min={0}
                value={form.num_vehiculos}
                onChange={e => setForm(p => ({ ...p, num_vehiculos: e.target.value }))}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-100 text-slate-800 transition-all font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                Años de Experiencia
              </label>
              <input
                type="number"
                min={0}
                value={form.experiencia_anos}
                onChange={e => setForm(p => ({ ...p, experiencia_anos: e.target.value }))}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-100 text-slate-800 transition-all font-medium"
              />
            </div>
            {/* Espacio reservado o vacío */}
            <div />
          </div>

          {/* Especialidades */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-3 block">
              Especialidades técnicas
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {ESPECIALIDADES_OPTIONS.map(item => {
                const selected = form.especialidades.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleEspecialidad(item)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-bold text-left transition-all border
                      ${selected
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2 block">
              Notas adicionales
            </label>
            <textarea
              rows={2}
              value={form.notas_adicionales}
              onChange={e => setForm(p => ({ ...p, notas_adicionales: e.target.value }))}
              placeholder="Cualquier información relevante sobre tu empresa…"
              className="w-full text-sm rounded-xl border border-slate-200 p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 text-slate-800 placeholder:text-slate-300"
            />
          </div>

          {/* Save button */}
          <div className="space-y-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-12 bg-slate-900 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {saving
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando…</>
                : <><Save className="w-4 h-4 mr-2" /> Guardar perfil de empresa</>
              }
            </Button>
            
            {dismissible && (
              <button 
                onClick={onDismiss}
                className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors py-1"
              >
                Omitir por ahora
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
