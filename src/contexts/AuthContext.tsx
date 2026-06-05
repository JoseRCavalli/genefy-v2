import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockDemoUser: User = {
  id: 'demo-user-id',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'demo@gmail.com',
  role: 'authenticated',
  updated_at: new Date().toISOString(),
};

const mockDemoSession: Session = {
  access_token: 'mock-access-token',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'mock-refresh-token',
  user: mockDemoUser,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Chamar getSession() no mount
    async function getInitialSession() {
      try {
        if (localStorage.getItem('genefy_demo_session') === 'true') {
          setSession(mockDemoSession);
          setUser(mockDemoUser);
          setLoading(false);
          return;
        }
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (err) {
        console.error('Error fetching initial session:', err);
      } finally {
        setLoading(false);
      }
    }

    getInitialSession();

    // 2. Escutar onAuthStateChange() reativamente
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (localStorage.getItem('genefy_demo_session') === 'true') {
        setSession(mockDemoSession);
        setUser(mockDemoUser);
        setLoading(false);
        return;
      }
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 3. Método de login
  async function signIn(email: string, password: string) {
    try {
      if (email.trim().toLowerCase() === 'demo@gmail.com' && password === 'genefy') {
        localStorage.setItem('genefy_demo_session', 'true');
        // Cookie lido pelos Route Handlers: a API serve dados FICTÍCIOS para a
        // sessão demo (sem tocar no Supabase) — ver src/lib/demo-server.ts
        document.cookie = 'genefy_demo_session=true; path=/; max-age=31536000; SameSite=Lax';
        setSession(mockDemoSession);
        setUser(mockDemoUser);
        return { error: null };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch (err: any) {
      if (email.trim().toLowerCase() === 'demo@gmail.com' && password === 'genefy') {
        localStorage.setItem('genefy_demo_session', 'true');
        document.cookie = 'genefy_demo_session=true; path=/; max-age=31536000; SameSite=Lax';
        setSession(mockDemoSession);
        setUser(mockDemoUser);
        return { error: null };
      }
      return { error: err.message || 'Erro inesperado ao entrar.' };
    }
  }

  // 4. Método de logout
  async function signOut() {
    try {
      localStorage.removeItem('genefy_demo_session');
      document.cookie = 'genefy_demo_session=; path=/; max-age=0';
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  }

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

/**
 * ESCALABILIDADE MULTI-FAZENDA:
 *
 * Para suportar múltiplas fazendas, o useFarm.ts deve ser atualizado para:
 *   const { data } = await supabase
 *     .from('farms')
 *     .select('*')
 *     .eq('user_id', user.id)   ← filtrar pelo usuário logado
 *     .single();
 *
 * E a tabela 'farms' no Supabase deve ter:
 *   - Coluna user_id UUID referenciando auth.users(id)
 *   - RLS policy: "Users can only see their own farms"
 *     CREATE POLICY "own_farms" ON farms
 *     FOR ALL USING (auth.uid() = user_id);
 *
 * Com isso, cada produtor que fizer cadastro vê apenas sua fazenda.
 * A Granja Cavalli continuará funcionando normalmente após vincular
 * seu farm_id ao user_id criado no Supabase Auth.
 */
