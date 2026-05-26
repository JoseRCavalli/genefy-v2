import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmhrsfowchitwnruxqxx.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtaHJzZm93Y2hpdHducnV4cXh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMzM0OTAsImV4cCI6MjA5MTcwOTQ5MH0.SGx6xk2tEq-Uzu_hFfZ3SvR-NXtLhwYURCBPRugRhSY';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtaHJzZm93Y2hpdHducnV4cXh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjEzMzQ5MCwiZXhwIjoyMDkxNzA5NDkwfQ.fbXfZCodcfNWc50bQXlfoUllSqi9PnMjytubPWBXgCY';

// 1. Client representing a public/anonymous user (like the frontend)
const supabaseAnon = createClient(SUPABASE_URL, ANON_KEY);

// 2. Client representing administrative/service access (bypasses RLS)
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);

async function testRLS() {
  console.log('🔍 Iniciando testes de verificação do Row Level Security (RLS)...');

  // --- Teste 1: Buscar fazendas como usuário anônimo (padrão) ---
  console.log('\n--- Teste 1: Buscar fazendas como Usuário Anônimo (antes de definir owner_id) ---');
  const { data: farmsBefore, error: errBefore } = await supabaseAnon.from('farms').select('id, name, owner_id');
  if (errBefore) {
    console.error('❌ Erro ao buscar fazendas como anon:', errBefore.message);
  } else {
    console.log(`✅ Fazendas retornadas (${farmsBefore?.length || 0}):`);
    console.log(farmsBefore);
  }

  if (!farmsBefore || farmsBefore.length === 0) {
    console.log('⚠️ Nenhuma fazenda disponível para teste. Por favor, execute o seed primeiro.');
    return;
  }

  const targetFarm = farmsBefore[0];
  let tempUser: any = null;

  try {
    // --- Criar usuário de teste temporário no Supabase Auth ---
    console.log('\n--- Criando usuário temporário no Supabase Auth para teste de FK ---');
    const email = `test-rls-${Date.now()}@example.com`;
    const { data: userData, error: errUser } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: 'TemporaryPassword123!',
      email_confirm: true
    });

    if (errUser || !userData.user) {
      console.error('❌ Erro ao criar usuário temporário:', errUser?.message);
      return;
    }
    tempUser = userData.user;
    console.log(`✅ Usuário temporário criado: ID = ${tempUser.id}, Email = ${tempUser.email}`);

    // --- Teste 2: Definir owner_id privado para uma fazenda (via Admin/Service Role) ---
    console.log(`\n--- Teste 2: Definindo owner_id da fazenda "${targetFarm.name}" como privado para o usuário "${tempUser.id}" ---`);
    const { error: errUpdate } = await supabaseAdmin
      .from('farms')
      .update({ owner_id: tempUser.id })
      .eq('id', targetFarm.id);

    if (errUpdate) {
      console.error('❌ Erro ao atualizar owner_id da fazenda:', errUpdate.message);
      return;
    }
    console.log('✅ Fazenda atualizada com sucesso no banco de dados.');

    // --- Teste 3: Tentar buscar fazendas como anônimo novamente ---
    console.log('\n--- Teste 3: Buscar fazendas como Usuário Anônimo (depois de definir owner_id privado) ---');
    const { data: farmsAfter, error: errAfter } = await supabaseAnon.from('farms').select('id, name, owner_id');
    if (errAfter) {
      console.error('❌ Erro ao buscar fazendas como anon:', errAfter.message);
    } else {
      console.log(`✅ Fazendas retornadas (${farmsAfter?.length || 0}):`);
      console.log(farmsAfter);
      
      const containsTarget = farmsAfter.some(f => f.id === targetFarm.id);
      if (!containsTarget) {
        console.log('🎉 SUCESSO! A fazenda privada foi ocultada do usuário anônimo pelo RLS.');
      } else {
        console.log('❌ FALHA! A fazenda privada ainda está visível para o usuário anônimo.');
      }
    }

    // --- Teste 4: Tentar buscar fêmeas da fazenda privada como anônimo ---
    console.log('\n--- Teste 4: Buscar fêmeas da fazenda privada como Usuário Anônimo ---');
    const { data: femalesAnon, error: errFemales } = await supabaseAnon
      .from('females')
      .select('id, animal_id, farm_id')
      .eq('farm_id', targetFarm.id)
      .limit(5);

    if (errFemales) {
      console.error('❌ Erro ao buscar fêmeas como anon:', errFemales.message);
    } else {
      console.log(`✅ Fêmeas retornadas: ${femalesAnon?.length || 0}`);
      if (!femalesAnon || femalesAnon.length === 0) {
        console.log('🎉 SUCESSO! Os animais da fazenda privada foram protegidos pelo RLS.');
      } else {
        console.log('❌ FALHA! Animais de fazenda privada vazaram para usuário anônimo.');
      }
    }

  } finally {
    // --- Limpeza: Restaurar owner_id para NULL ---
    console.log(`\n--- Limpeza: Restaurando owner_id da fazenda "${targetFarm.name}" para NULL ---`);
    const { error: errCleanup } = await supabaseAdmin
      .from('farms')
      .update({ owner_id: null })
      .eq('id', targetFarm.id);

    if (errCleanup) {
      console.error('❌ Erro ao limpar owner_id:', errCleanup.message);
    } else {
      console.log('✅ Banco de dados restaurado ao estado original.');
    }

    // --- Limpeza: Deletar usuário temporário ---
    if (tempUser) {
      console.log(`\n--- Limpeza: Deletando usuário temporário "${tempUser.id}" ---`);
      const { error: errDeleteUser } = await supabaseAdmin.auth.admin.deleteUser(tempUser.id);
      if (errDeleteUser) {
        console.error('❌ Erro ao deletar usuário temporário:', errDeleteUser.message);
      } else {
        console.log('✅ Usuário temporário removido do auth.users.');
      }
    }
  }
}

testRLS().catch(console.error);
