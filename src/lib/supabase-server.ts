/**
 * Cliente Supabase SERVER-SIDE (Route Handlers) — @supabase/ssr.
 *
 * Usa a SESSÃO DO USUÁRIO (cookies de auth) para que o RLS continue sendo a
 * única fonte de autorização (farms.user_id -> auth.uid()). NUNCA usar a
 * service role key aqui — ela é reservada ao script de seed.
 */
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';

export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Chamado a partir de contexto sem permissão de escrita de cookies
            // (ex.: durante render) — o refresh fica a cargo do proxy.
          }
        },
      },
    }
  );
}

/**
 * Resolve o usuário autenticado da requisição. Sem sessão válida -> user null.
 * A conta demo (sessão mock, sem cookies Supabase) cai aqui em 401 por
 * construção — dados reais são inalcançáveis para ela.
 */
export async function requireUser(): Promise<
  { supabase: SupabaseClient; user: User; error: null } | { supabase: null; user: null; error: NextResponse }
> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase: null,
      user: null,
      error: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }),
    };
  }

  return { supabase, user, error: null };
}
