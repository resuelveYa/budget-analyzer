'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import FullAnalysisView from '@/components/analyzer/FullAnalysisView';

export default function AnalysisDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const id = params.id as string;
    
    // Cargar desde localStorage
    const stored = localStorage.getItem(id);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setAnalysisData(data);
      } catch (error) {
        console.error('Error parsing analysis data:', error);
        router.push('/analyze');
      }
    } else {
      router.push('/analyze');
    }
    
    setIsLoading(false);
  }, [params.id, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Análisis no encontrado</p>
      </div>
    );
  }

  return <FullAnalysisView analysisData={analysisData} />;
}
