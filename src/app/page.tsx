'use client';

import dynamic from 'next/dynamic';

// Dynamically import the LandingPage component
const LandingPage = dynamic(() => import('@/components/LandingPage'), {
  ssr: false, // Disable server-side rendering for Three.js components
  loading: () => <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-white via-green-50 to-red-50">Loading...</div>,
});

export default function Home() {
  return <LandingPage />;
}
