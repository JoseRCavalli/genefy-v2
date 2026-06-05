/**
 * Proxy do Next 16 (novo nome do middleware) — refresh da sessão Supabase.
 * Padrão da doc do @supabase/ssr: renova tokens expirados e propaga os
 * cookies atualizados para a request e a response.
 */
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANTE: getUser() dispara o refresh do token quando expirado.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  // Só onde sessão importa: API interna e o shell autenticado.
  matcher: ['/api/:path*', '/app'],
};
