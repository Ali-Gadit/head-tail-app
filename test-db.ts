import { supabase } from './src/lib/supabase';

async function test() {
  const { data, error } = await supabase.from('rooms').select('toss_call').limit(1);
  console.log('Data:', data);
  console.log('Error:', error);
}

test();
