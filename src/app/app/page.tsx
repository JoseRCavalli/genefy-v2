'use client';

// CSR puro (idêntico ao comportamento do Vite): ssr:false exige Client Component.
// AppShell decide DemoApp (NEXT_PUBLIC_DEMO_MODE) vs AuthGuard>SupabaseApp.
import dynamic from 'next/dynamic';

const AppShell = dynamic(() => import('../../views/App'), { ssr: false });

export default function Page() {
  return <AppShell />;
}
