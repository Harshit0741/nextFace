'use client';

import dynamic from 'next/dynamic';

const FaceTracker = dynamic(() => import('@/components/FaceTracker'), { ssr: false });

export default function FaceClientWrapper() {
  return <FaceTracker />;
}
