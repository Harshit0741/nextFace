'use client';

import dynamic from 'next/dynamic';

// Dynamically import FaceTracker with SSR disabled
const FaceTracker = dynamic(() => import('@/components/FaceTracker'), { ssr: false });

export default function FaceClientWrapper() {
  return <FaceTracker />;
}
