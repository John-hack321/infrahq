'use client';

import dynamic from 'next/dynamic';

// Dynamically import the LandingPage component
const LandingPage = dynamic(() => import('@/components/LandingPage'), {
  ssr: false, // Disable server-side rendering for Three.js components
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-transparent">
      <div className="text-2xl text-white/80 animate-pulse">Loading...</div>
    </div>
  ),
});

export default function Home() {
  return <LandingPage />;
}
