import { Suspense } from 'react';
import MainWrapper from '@/components/MainWrapper';

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading Dashboard...</div>}>
      <MainWrapper />
    </Suspense>
  );
}