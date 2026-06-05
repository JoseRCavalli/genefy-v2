'use client';

// CSR puro (idêntico ao comportamento do Vite): ssr:false exige Client Component.
import dynamic from 'next/dynamic';

const LandingPage = dynamic(
  () => import('../views/LandingPage').then((m) => m.LandingPage),
  { ssr: false }
);

export default function Page() {
  return <LandingPage />;
}
