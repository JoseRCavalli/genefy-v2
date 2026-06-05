/**
 * Suporte SERVER-SIDE à conta demo (demo@gmail.com) — Fase 3.
 *
 * A sessão demo é marcada por um cookie (genefy_demo_session) gravado no
 * login. Os Route Handlers checam o cookie ANTES do requireUser e servem
 * DADOS FICTÍCIOS sem tocar no Supabase. Com isso, DEMO_FEMALES e
 * CATALOG_BULLS saem do bundle do client.
 *
 * Escritas da conta demo continuam client-side (memória/localStorage) — o
 * servidor é stateless e nunca persiste nada para a demo.
 */
import { cookies } from 'next/headers';
import { DEMO_FEMALES } from './demo-females';
import { femalesToRows, rowToFemale } from './row-mappers';
import type { FarmRow, FemaleRow } from './supabase';
import type { Female } from './genetics';

export const DEMO_COOKIE = 'genefy_demo_session';
export const DEMO_FARM_ID = 'demo-account-farm';

export async function isDemoRequest(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(DEMO_COOKIE)?.value === 'true';
}

export const DEMO_FARM_ROW: FarmRow = {
  id: DEMO_FARM_ID,
  name: 'Fazenda Teste',
  owner_name: 'user',
  created_at: '2026-01-01T00:00:00.000Z',
};

export function demoFemaleRows(): FemaleRow[] {
  return femalesToRows(DEMO_FARM_ID, DEMO_FEMALES);
}

export function demoFemales(animalIds?: string[]): Female[] {
  const rows = demoFemaleRows();
  const females = rows.map(rowToFemale);
  if (animalIds && animalIds.length > 0) {
    return females.filter(f => animalIds.includes(f.id));
  }
  return females;
}
