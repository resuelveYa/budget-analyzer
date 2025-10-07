import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileText, History, TrendingUp, Clock } from 'lucide-react';

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">
          Hola, {user.firstName || 'Usuario'} 👋
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
