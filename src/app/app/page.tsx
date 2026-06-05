'use client';

// CSR puro: ssr:false exige Client Component. AppShell = AuthGuard>SupabaseApp.
import dynamic from 'next/dynamic';

const AppShell = dynamic(() => import('../../views/App'), { ssr: false });

export default function Page() {
  return <AppShell />;
}
