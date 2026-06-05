/**
 * Store de acasalamentos da CONTA DEMO (demo@gmail.com) — localStorage.
 *
 * Antes da Fase 2 a conta demo gravava matings na farm real compartilhada
 * "Fazenda Teste". Agora cada browser tem seu próprio histórico fictício e o
 * banco nunca é tocado (a sessão mock nem teria cookies para passar na API).
 */
import type { MatingRow, FemaleRow, BullRow } from './supabase';

const LS_KEY = 'genefy_demo_account_matings';

export type DemoMating = MatingRow & { females?: FemaleRow; bulls?: BullRow };

function read(): DemoMating[] {
  try {
    const s = localStorage.getItem(LS_KEY);
    return s ? (JSON.parse(s) as DemoMating[]) : [];
  } catch {
    return [];
  }
}

function write(list: DemoMating[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

export function listDemoMatings(): DemoMating[] {
  return read().sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
}

export function insertDemoMating(input: {
  farm_id: string;
  femaleRow: FemaleRow;
  bullRow: BullRow | null;
  bullCode: string;
  option_rank: number;
  score: number | null;
  inbreeding_pct: number | null;
  is_sexed_semen?: boolean;
  status?: MatingRow['status'];
}): void {
  const list = read();
  const id = `demo-mating-${Date.now()}-${list.length}`;
  list.push({
    id,
    farm_id: input.farm_id,
    female_id: input.femaleRow.id,
    bull_id: input.bullRow?.id ?? input.bullCode,
    option_rank: input.option_rank,
    score: input.score,
    inbreeding_pct: input.inbreeding_pct,
    is_sexed_semen: input.is_sexed_semen ?? false,
    status: input.status ?? 'planned',
    mating_date: null,
    notes: null,
    created_at: new Date().toISOString(),
    females: input.femaleRow,
    bulls: input.bullRow ?? undefined,
  });
  write(list);
}

export function updateDemoMatingStatus(id: string, status: MatingRow['status']): void {
  write(read().map(m => (m.id === id ? { ...m, status } : m)));
}

export function deleteDemoMating(id: string): void {
  write(read().filter(m => m.id !== id));
}
