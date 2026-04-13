import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TextBudgetAnalyzer from '@/components/analyzer/TextBudgetAnalyzer';

export const metadata = {
  title: 'Analizar Presupuesto - Budget Analyzer',
};

export default async function AnalyzePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://licitex.cl';
    redirect(`${landingUrl}/sign-in`);
  }

  return <TextBudgetAnalyzer />;
}
