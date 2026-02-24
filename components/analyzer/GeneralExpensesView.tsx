"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Save,
  TrendingUp,
  Users,
  Truck,
  Fuel,
  BookOpen,
  Map as MapIcon,
  ShieldAlert,
  FileCheck,
  Building2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  GeneralExpensesData,
  GeneralExpenseCategory,
  GeneralExpenseItem
} from '@/types/budgetAnalysis';
import { supabase, getAccessToken } from '@/lib/supabase/client';

interface GeneralExpensesViewProps {
  analysisId: string;
  initialData?: GeneralExpensesData;
  profesionales?: any[];
  onSave?: (data: GeneralExpensesData) => void;
}

const DEFAULT_CATEGORIES = [
  { nombre: 'Mano de Obra', icon: Users },
  { nombre: 'Maquinaria', icon: Truck },
  { nombre: 'Combustible', icon: Fuel },
  { nombre: 'Insumos oficina', icon: BookOpen },
  { nombre: 'Gastos topográficos', icon: MapIcon },
  { nombre: 'Elementos de protección personal', icon: ShieldAlert },
  { nombre: 'Pólizas y seguros', icon: FileCheck },
  { nombre: 'Oficina central', icon: Building2 },
];

export const GeneralExpensesView: React.FC<GeneralExpensesViewProps> = ({
  analysisId,
  initialData,
  profesionales = [],
  onSave
}) => {
  const [data, setData] = useState<GeneralExpensesData>(() => {
    if (initialData && initialData.categorias && initialData.categorias.length > 0) {
      return initialData;
    }

    // Heurística para inicializar con profesionales si no hay datos
    const categories: GeneralExpenseCategory[] = DEFAULT_CATEGORIES.map(cat => {
      const categoryId = Math.random().toString(36).substring(7);

      let items: GeneralExpenseItem[] = [];

      if (cat.nombre === 'Mano de Obra' && profesionales.length > 0) {
        items = profesionales.map(p => {
          const cargo = p.cargo || p.nombre || 'Personal';

          // Priorizar el sueldo detectado por la IA si existe
          let sueldo = p.sueldo_estimado_mercado_clp || 0;

          // Heurística de respaldo solo si no hay dato de la IA
          if (!sueldo) {
            sueldo = 1200000;
            if (cargo.toLowerCase().includes('residente')) sueldo = 2800000;
            else if (cargo.toLowerCase().includes('ayudante')) sueldo = 1300000;
            else if (cargo.toLowerCase().includes('jefe')) sueldo = 2200000;
            else if (cargo.toLowerCase().includes('prevencionista')) sueldo = 1300000;
            else if (cargo.toLowerCase().includes('administrativo')) sueldo = 850000;
            else if (cargo.toLowerCase().includes('jornal')) sueldo = 650000;
          }

          return {
            id: Math.random().toString(36).substring(7),
            descripcion: cargo,
            unidad: 'Mes',
            cantidad: 1,
            precio_unitario: sueldo,
            subtotal: sueldo
          };
        });
      }

      return {
        id: categoryId,
        nombre: cat.nombre,
        items,
        subtotal: items.reduce((sum, item) => sum + item.subtotal, 0)
      };
    });

    return {
      categorias: categories,
      total: categories.reduce((sum, cat) => sum + cat.subtotal, 0)
    };
  });

  const [isSaving, setIsSaving] = useState(false);

  // Recalcular totales cuando los items cambian
  const updateTotals = (categorias: GeneralExpenseCategory[]) => {
    const updatedCategorias = categorias.map(cat => ({
      ...cat,
      subtotal: cat.items.reduce((sum, item) => sum + item.subtotal, 0)
    }));

    return {
      categorias: updatedCategorias,
      total: updatedCategorias.reduce((sum, cat) => sum + cat.subtotal, 0)
    };
  };

  const handleAddItem = (categoryId: string) => {
    const newData = { ...data };
    const category = newData.categorias.find(c => c.id === categoryId);
    if (category) {
      const newItem: GeneralExpenseItem = {
        id: Math.random().toString(36).substring(7),
        descripcion: '',
        unidad: 'Global',
        cantidad: 1,
        precio_unitario: 0,
        subtotal: 0
      };
      category.items.push(newItem);
      setData(updateTotals(newData.categorias));
    }
  };

  const handleRemoveItem = (categoryId: string, itemId: string) => {
    const newData = { ...data };
    const category = newData.categorias.find(c => c.id === categoryId);
    if (category) {
      category.items = category.items.filter(i => i.id !== itemId);
      setData(updateTotals(newData.categorias));
    }
  };

  const handleUpdateItem = (categoryId: string, itemId: string, field: keyof GeneralExpenseItem, value: any) => {
    const newData = { ...data };
    const category = newData.categorias.find(c => c.id === categoryId);
    if (category) {
      const item = category.items.find(i => i.id === itemId);
      if (item) {
        (item as any)[field] = value;
        if (field === 'cantidad' || field === 'precio_unitario') {
          item.subtotal = item.cantidad * item.precio_unitario;
        }
        setData(updateTotals(newData.categorias));
      }
    }
  };

  const handleAddCategory = () => {
    const newCategory: GeneralExpenseCategory = {
      id: Math.random().toString(36).substring(7),
      nombre: 'Nueva Categoría',
      items: [],
      subtotal: 0
    };
    setData({
      ...data,
      categorias: [...data.categorias, newCategory]
    });
  };

  const handleRemoveCategory = (categoryId: string) => {
    const updatedCategorias = data.categorias.filter(c => c.id !== categoryId);
    setData(updateTotals(updatedCategorias));
  };

  const handleSave = async () => {
    if (!analysisId || analysisId === 'undefined') {
      toast.error('Error: ID de análisis no válido');
      return;
    }

    setIsSaving(true);
    try {
      const token = await getAccessToken();

      // Normalizar la URL para evitar el doble /api
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/api$/, '');

      const response = await fetch(`${baseUrl}/api/budget-analysis/${analysisId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          gastos_generales_data: data
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al guardar');
      }

      toast.success('Gastos generales guardados correctamente');
      if (onSave) onSave(data);
    } catch (error) {
      console.error('Error saving general expenses:', error);
      toast.error('No se pudieron guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatNumber = (val: number) => {
    if (!val && val !== 0) return '';
    return new Intl.NumberFormat('es-CL').format(val);
  };

  const parseNumber = (val: string) => {
    const cleanValue = val.replace(/[^\d]/g, '');
    return parseInt(cleanValue, 10) || 0;
  };

  return (
    <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Header con Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 rounded-2xl bg-slate-900 text-white border-none shadow-xl flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-xl">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Gastos Generales</p>
            <h3 className="text-xl font-black mt-0.5">{formatCurrency(data.total)}</h3>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl bg-white border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mano de Obra</p>
            <h3 className="text-xl font-black mt-0.5">
              {formatCurrency(data.categorias.find(c => c.nombre === 'Mano de Obra')?.subtotal || 0)}
            </h3>
          </div>
        </Card>

        <div className="flex flex-col gap-2">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-sm shadow-md"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar Cambios
          </Button>
        </div>
      </div>

      {/* Listado de Categorías */}
      <div className="space-y-6">
        {data.categorias.map((category) => {
          const Icon = DEFAULT_CATEGORIES.find(dc => dc.nombre === category.nombre)?.icon || BookOpen;

          return (
            <Card key={category.id} className="rounded-2xl border-slate-200 p-4 bg-white shadow-sm overflow-hidden group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                    <Icon className="w-5 h-5 text-slate-600 group-hover:text-blue-600" />
                  </div>
                  <div>
                    <Input
                      value={category.nombre}
                      onChange={(e) => {
                        const newData = { ...data };
                        const cat = newData.categorias.find(c => c.id === category.id);
                        if (cat) cat.nombre = e.target.value;
                        setData(newData);
                      }}
                      className="text-lg font-bold text-slate-900 border-none bg-transparent p-0 h-auto focus-visible:ring-0 w-auto hover:bg-slate-50 rounded px-2"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Subtotal Categoría</p>
                    <p className="text-base font-black text-slate-900">{formatCurrency(category.subtotal)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveCategory(category.id)}
                    className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-[9px] font-bold uppercase tracking-widest border-b border-slate-100">
                      <th className="px-3 py-2 text-left">Descripción</th>
                      <th className="px-3 py-2 text-center w-24">Unidad</th>
                      <th className="px-3 py-2 text-center w-24">Cant.</th>
                      <th className="px-3 py-2 text-right w-36">P. Unitario</th>
                      <th className="px-3 py-2 text-right w-36">Subtotal</th>
                      <th className="px-2 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {category.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <Input
                            value={item.descripcion}
                            onChange={(e) => handleUpdateItem(category.id, item.id, 'descripcion', e.target.value)}
                            placeholder="Ej: Profesional residente"
                            className="border-none bg-transparent font-medium text-slate-700 focus-visible:ring-1 focus-visible:ring-blue-100"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            value={item.unidad}
                            onChange={(e) => handleUpdateItem(category.id, item.id, 'unidad', e.target.value)}
                            className="border-none bg-transparent text-center font-bold text-slate-400 uppercase text-xs"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Input
                            type="number"
                            value={item.cantidad}
                            onChange={(e) => handleUpdateItem(category.id, item.id, 'cantidad', parseFloat(e.target.value) || 0)}
                            className="border-none bg-transparent text-center font-black text-slate-900 h-8"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-slate-400 font-bold text-xs">$</span>
                            <Input
                              type="text"
                              value={formatNumber(item.precio_unitario)}
                              onChange={(e) => handleUpdateItem(category.id, item.id, 'precio_unitario', parseNumber(e.target.value))}
                              className="border-none bg-transparent text-right font-bold text-slate-600 h-8 min-w-[100px] focus-visible:ring-0 px-1"
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className="font-black text-slate-900 text-sm">{formatCurrency(item.subtotal)}</span>
                        </td>
                        <td className="px-2 py-2 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(category.id, item.id)}
                            className="h-7 w-7 text-slate-200 hover:text-red-500 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={6} className="p-0">
                        <Button
                          variant="ghost"
                          onClick={() => handleAddItem(category.id)}
                          className="w-full h-10 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-none border-t border-dashed border-slate-100 font-bold gap-2 text-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Agregar Item
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          );
        })}

        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={handleAddCategory}
            className="w-full max-w-md rounded-2xl border-dashed border-2 border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/50 font-bold gap-2 h-12"
          >
            <Plus className="w-5 h-5" />
            Nueva Categoría de Gasto
          </Button>
        </div>
      </div>

      {data.categorias.length === 0 && (
        <Card className="p-20 flex flex-col items-center justify-center text-slate-300 border-dashed border-2 border-slate-100 rounded-[3rem]">
          <AlertCircle className="w-16 h-16 mb-6 opacity-20" />
          <p className="text-lg font-medium">No hay categorías de gastos generales</p>
          <Button
            onClick={handleAddCategory}
            variant="link"
            className="text-blue-500 font-bold mt-2"
          >
            Crear la primera categoría
          </Button>
        </Card>
      )}
    </div>
  );
};
