'use client';

// CSR puro (idêntico ao comportamento do Vite): ssr:false exige Client Component.
import dynamic from 'next/dynamic';

const SolicitarAcessoPage = dynamic(
  () => import('../../views/SolicitarAcessoPage').then((m) => m.SolicitarAcessoPage),
  { ssr: false }
);

export default function Page() {
  return <SolicitarAcessoPage />;
}
