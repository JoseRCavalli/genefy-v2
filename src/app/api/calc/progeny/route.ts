import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../../lib/supabase-server';
import { loadMergedBulls, loadFemales } from '../../../../lib/calc-data-server';
import { calcularIndicesProgenie } from '../../../../utils/calcularProgenie';

/**
 * POST /api/calc/progeny
 * body { farmId, femaleAnimalId, bullCode }
 * Calcula o Perfil Genético da Progênie (médias + consanguinidade via
 * genetics.ts) no servidor. Retorna PerfilProgenieProps.
 */
export async function POST(request: NextRequest) {
  const { supabase, error } = await requireUser();
  if (error) return error;

  const { farmId, femaleAnimalId, bullCode } = await request.json();

  if (!farmId || !femaleAnimalId || !bullCode) {
    return NextResponse.json(
      { error: 'farmId, femaleAnimalId e bullCode obrigatórios' },
      { status: 400 }
    );
  }

  const [allBulls, females] = await Promise.all([
    loadMergedBulls(supabase, farmId),
    loadFemales(supabase, farmId, [femaleAnimalId]),
  ]);

  const female = females[0];
  const bull = allBulls.find(b => b.code === bullCode);

  if (!female) return NextResponse.json({ error: 'Fêmea não encontrada' }, { status: 404 });
  if (!bull) return NextResponse.json({ error: 'Touro não encontrado' }, { status: 404 });

  return NextResponse.json(calcularIndicesProgenie(female, bull));
}
