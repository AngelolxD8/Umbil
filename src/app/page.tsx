import { Suspense } from 'react';
import MainWrapper from '@/components/MainWrapper';

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MainWrapper />
    </Suspense>
  );
}