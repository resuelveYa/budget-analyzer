'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileText, History, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuario';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">
          Hola, {firstName} 👋
        </h1>
        <p className="text-xl text-muted-foreground">
          Bienvenido a tu dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2 border-blue-500 bg-blue-50/50">
          <CardHeader>
            <CardTitle>Nuevo Análisis</CardTitle>
            <CardDescription>
              Sube un PDF y obtén resultados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="w-full">
              <Link href="/analyze">
                <FileText className="w-5 h-5 mr-2" />
                Analizar Presupuesto
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ver Historial</CardTitle>
            <CardDescription>
              Revisa tus análisis anteriores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href="/history">
                <History className="w-5 h-5 mr-2" />
                Ir al Historial
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
