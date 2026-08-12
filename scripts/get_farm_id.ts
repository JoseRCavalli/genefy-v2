import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  const { data, error } = await supabase.from('females').select('farm_id').limit(1);
  if (error) {
    console.error('Error fetching farm_id:', error);
  } else {
    console.log('Found farm_id:', data[0]?.farm_id);
  }
}

main();
