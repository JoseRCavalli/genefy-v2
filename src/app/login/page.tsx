'use client';

// CSR puro (idêntico ao comportamento do Vite): ssr:false exige Client Component.
import dynamic from 'next/dynamic';

const LoginPage = dynamic(
  () => import('../../views/LoginPage').then((m) => m.LoginPage),
  { ssr: false }
);

export default function Page() {
  return <LoginPage />;
}
