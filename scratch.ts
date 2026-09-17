import { supabase } from './src/lib/supabase';
(async () => {
    const { data, error } = await supabase.from('rooms').select('*').limit(1);
    console.log(JSON.stringify(data?.[0] || error));
})();
