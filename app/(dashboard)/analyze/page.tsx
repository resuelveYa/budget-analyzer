import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import TextBudgetAnalyzer from '@/components/analyzer/TextBudgetAnalyzer';

export const metadata = {
  title: 'Analizar Presupuesto - Budget Analyzer',
};

export default async function AnalyzePage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  return <TextBudgetAnalyzer />;
}
