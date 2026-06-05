'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const { signIn, session } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Com sessão ativa, vai direto para o app (substitui o <Navigate> do react-router)
  useEffect(() => {
    if (session) {
      router.replace('/app');
    }
  }, [session, router]);

  if (session) {
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      if (signInError.includes('Invalid login credentials') || signInError.toLowerCase().includes('invalid')) {
        setError('E-mail ou senha incorretos. Tente novamente.');
      } else {
        setError(signInError);
      }
      setIsLoading(false);
    }
  }

  return (
    <main className="flex h-screen w-full bg-surface text-on-surface antialiased overflow-hidden font-sans">
      {/* Left Side: Visual & Value Proposition */}
      <section className="hidden lg:flex lg:w-1/2 relative bg-primary overflow-hidden flex-col justify-between p-xl">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover opacity-30 mix-blend-overlay"
            alt="DNA Helix background pattern"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCcS2kgDdG3fCxRjqlfa6elOgwEeXcWriyrMghQW8oSFmzCIDSvAPZ2IIoRof3qfBiEvzOqaWotteHXIOseC3yxME6JPmqr3ID9lcqeU7eHOTVy80hBr3dMTocxh31jQpYs7JKc1y1e7asKlLH0x9OIhc4_p3Jy0YZIvtqyZ4mfGJpeRflzEjjxOQNqW0JcoXhoMA5lIx3qPRGFJfkE9_7R2auhyEa_cS9bk1qbMbZivF-qXNKRFlxgwIXd3ATdFVFvS0T_e4IK1tc"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary-container/80"></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-xs">
            <img
              src="/images/genefy-logo-dark.png"
              alt="Genefy Logo"
              className="h-10 w-auto object-contain brightness-0 invert"
            />
          </div>
        </div>

        <div className="relative z-10 max-w-xl">
          <h2 className="font-headline-xl text-headline-xl text-on-primary mb-md">Decodificando o futuro da sua pecuária.</h2>
          <p className="font-body-lg text-body-lg text-on-primary/80 mb-lg">
            Transforme dados genômicos complexos em decisões lucrativas. Acesse a plataforma líder em precisão genética para produtores e geneticistas.
          </p>
          <div className="grid grid-cols-2 gap-gutter">
            <div className="glass-effect rounded-xl p-md">
              <div className="text-tertiary-fixed font-headline-md text-headline-md mb-xs">99.8%</div>
              <div className="text-on-primary/70 font-label-md text-label-md uppercase tracking-wider">Precisão Técnica</div>
            </div>
            <div className="glass-effect rounded-xl p-md">
              <div className="text-tertiary-fixed font-headline-md text-headline-md mb-xs">+45%</div>
              <div className="text-on-primary/70 font-label-md text-label-md uppercase tracking-wider">Ganho Genético</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-sm">
          <p className="font-label-sm text-label-sm text-on-primary/60">Confiado por fazendas de elite no Brasil.</p>
        </div>
      </section>

      {/* Right Side: Login Form */}
      <section className="w-full lg:w-1/2 flex flex-col justify-center items-center bg-surface px-margin-mobile md:px-xl">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-xs mb-lg">
            <img
              src="/images/genefy-logo-dark.png"
              alt="Genefy Logo"
              className="h-12 w-auto object-contain"
            />
          </div>

          <div className="mb-lg text-center lg:text-left">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-xs">Bem-vindo de volta</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Entre com suas credenciais para acessar o painel genômico.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-md">
            <div className="space-y-xs">
              <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="email">E-mail Corporativo</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">mail</span>
                <input
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary focus:bg-surface-container-lowest transition-all outline-none text-on-surface font-body-md"
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@fazenda.com.br"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-xs">
              <div className="flex justify-between items-center">
                <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="password">Senha</label>
                <a className="font-label-sm text-label-sm text-secondary hover:text-primary transition-colors" href="#">Esqueceu a senha?</a>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">lock</span>
                <input
                  className="w-full pl-12 pr-12 py-3.5 bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary focus:bg-surface-container-lowest transition-all outline-none text-on-surface font-body-md"
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-xs py-xs">
              <input className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary bg-surface-container-low" id="remember" type="checkbox" />
              <label className="font-label-md text-label-md text-on-surface-variant cursor-pointer select-none" htmlFor="remember">Lembrar deste dispositivo por 30 dias</label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 flex gap-2 items-center font-medium">
                <span className="material-symbols-outlined text-sm shrink-0">error</span>
                <span>{error}</span>
              </div>
            )}

            <button
              className="w-full bg-primary text-on-primary py-4 rounded-xl font-label-md text-label-md hover:bg-primary-container active:scale-[0.98] transition-all shadow-lg shadow-primary/10 flex items-center justify-center gap-xs disabled:opacity-75 disabled:cursor-not-allowed"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Acessar Plataforma</span>
                  <span className="material-symbols-outlined text-sm font-semibold">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-lg text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Ainda não possui acesso?{' '}
              <Link className="text-secondary font-label-md hover:underline font-semibold" href="/solicitar">
                Solicitar demonstração
              </Link>
            </p>
          </div>

          {/* Footer-like Links for Auth Page */}
          <div className="mt-lg pt-lg border-t border-outline-variant/30 flex justify-center gap-lg">
            <Link className="font-label-sm text-label-sm text-outline hover:text-on-surface-variant transition-colors" href="/">Início</Link>
            <a className="font-label-sm text-label-sm text-outline hover:text-on-surface-variant transition-colors" href="#">Termos</a>
            <a className="font-label-sm text-label-sm text-outline hover:text-on-surface-variant transition-colors" href="#">Privacidade</a>
          </div>
        </div>
      </section>
    </main>
  );
}
