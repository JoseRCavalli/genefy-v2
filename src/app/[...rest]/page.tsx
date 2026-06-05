import { redirect } from 'next/navigation';

// Replica o <Route path="*" element={<Navigate to="/" replace />} /> do react-router.
export default function CatchAll() {
  redirect('/');
}
