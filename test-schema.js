const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rwowzlziyhpqnrydvwlr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3b3d6bHppeWhwcW5yeWR2d2xyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NDgyMDYsImV4cCI6MjA5MzIyNDIwNn0.pO8RVccA-feGa_weAtegs83M05UydcG5MAq6DKgEHE0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase.from('rooms').select('toss_call').limit(1);
  console.log('Error:', error);
  console.log('Data:', data);
}

check();
