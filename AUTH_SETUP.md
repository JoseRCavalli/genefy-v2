# Configuração de Autenticação — Genefy v2

## 1. Habilitar Auth no Supabase

No dashboard do Supabase (supabase.com):
1. Vá em Authentication → Settings
2. Confirme que "Email Auth" está habilitado

## 2. Criar usuário da Granja Cavalli

No dashboard do Supabase:
1. Vá em Authentication → Users
2. Clique "Add user" → "Create new user"
3. Email: `pedrocavalli131@gmail.com`
4. Senha: defina uma senha segura (não use senhas antigas)
5. Confirme o e-mail manualmente (botão "Confirm email")

## 3. Vincular usuário à fazenda (IMPORTANTE)

Execute no SQL Editor do Supabase:

```sql
-- Pega o user_id do Pedro
SELECT id FROM auth.users WHERE email = 'pedrocavalli131@gmail.com';

-- Vincula à fazenda existente (substitua USER_ID_AQUI pelo id retornado no select acima)
ALTER TABLE farms ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
UPDATE farms SET user_id = 'USER_ID_AQUI' WHERE name = 'Granja Cavalli';
```

## 4. Habilitar RLS (Row Level Security)

```sql
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_farms" ON farms FOR ALL USING (auth.uid() = user_id);

-- Repita para as outras tabelas:
ALTER TABLE females ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_females" ON females FOR ALL USING (
  farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid())
);

ALTER TABLE tank_bulls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_tank" ON tank_bulls FOR ALL USING (
  farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid())
);
```

## 5. Variáveis de ambiente no Vercel

No dashboard da Vercel, confirme que existem:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_DEMO_MODE=false`

## 6. Testar localmente

```bash
npm run dev
# Acesse http://localhost:5173
# Deve aparecer a tela de login
# Use as credenciais criadas no passo 2
```
