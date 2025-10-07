'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileText } from 'lucide-react';

export default function HistoryPage() {
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
