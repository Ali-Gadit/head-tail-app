import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rwowzlziyhpqnrydvwlr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3b3d6bHppeWhwcW5yeWR2d2xyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NDgyMDYsImV4cCI6MjA5MzIyNDIwNn0.pO8RVccA-feGa_weAtegs83M05UydcG5MAq6DKgEHE0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: users, error: searchErr } = await supabase
    .from('profiles')
    .select('id, username, premium_currency')
    .ilike('username', '%aligadit%');

  if (searchErr) {
    console.error('Error finding user:', searchErr);
    return;
  }

  if (!users || users.length === 0) {
    console.error('User not found!');
    return;
  }

  const user = users[0];
  console.log('Found user:', user);

  const { data, error } = await supabase
    .from('profiles')
    .update({ premium_currency: (user.premium_currency || 0) + 100000 })
    .eq('id', user.id)
    .select();

  if (error) {
    console.error('Error updating:', error);
  } else {
    console.log('Updated user successfully:', data);
  }
}
run();
