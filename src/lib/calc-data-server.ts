/**
 * Carregamento de dados para os endpoints de CÁLCULO (server-side).
 *
 * Reconstrói no servidor exatamente os mesmos inputs que os hooks montam no
 * client: touros = CATALOG_BULLS + custom/overrides do banco (merge idêntico
 * ao useBulls); fêmeas = rows do banco convertidas por rowToFemale.
 * O client manda IDs/códigos — nunca os objetos (payloads pequenos).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { CATALOG_BULLS } from './catalog-bulls';
import { rowToBull, rowToFemale } from './row-mappers';
import type { BullRow, FemaleRow } from './supabase';
import type { Bull, Female } from './genetics';

/** Mesmo merge do useBulls: catálogo estático + custom do banco (override por code). */
export async function loadMergedBulls(supabase: SupabaseClient, farmId: string): Promise<Bull[]> {
  const PAGE = 1000;
  let allRows: BullRow[] = [];
  let from = 0;
  while (true) {
    const { data } = await supabase
      .from('bulls')
      .select('*')
      .eq('farm_id', farmId)
      .eq('is_custom', true)
      .range(from, from + PAGE - 1);
    if (!data?.length) break;
    allRows = [...allRows, ...data];
    if (data.length < PAGE) break;
    from += PAGE;
  }

  const custom: Bull[] = allRows.map(rowToBull);
  const merged = CATALOG_BULLS.map(baseBull => {
    const customOverride = custom.find(c => c.code === baseBull.code);
    return customOverride ?? baseBull;
  });
  const customOnly = custom.filter(c => !CATALOG_BULLS.some(b => b.code === c.code));
  return [...merged, ...customOnly];
}

/** Fêmeas da fazenda (todas, ou filtradas por animal_id) convertidas para domínio. */
export async function loadFemales(
  supabase: SupabaseClient,
  farmId: string,
  animalIds?: string[]
): Promise<Female[]> {
  let query = supabase.from('females').select('*').eq('farm_id', farmId).order('animal_id');
  if (animalIds && animalIds.length > 0) {
    query = query.in('animal_id', animalIds);
  }
  const { data } = await query;
  return ((data ?? []) as FemaleRow[]).map(rowToFemale);
}
