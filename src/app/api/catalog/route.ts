import { NextResponse } from 'next/server';
import { requireUser } from '../../../lib/supabase-server';
import { isDemoRequest } from '../../../lib/demo-server';
import { CATALOG_BULLS } from '../../../lib/catalog-bulls';

/**
 * GET /api/catalog — catálogo estático de touros (CATALOG_BULLS).
 * Fase 3: o catálogo saiu do bundle do client; é servido aqui para usuários
 * logados E para a sessão demo (cookie). Resposta cacheável no browser.
 */
export async function GET() {
  const demo = await isDemoRequest();
  if (!demo) {
    const { error } = await requireUser();
    if (error) return error;
  }

  return NextResponse.json(CATALOG_BULLS, {
    headers: {
      // Catálogo muda raramente — evita re-baixar ~2MB a cada navegação
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
