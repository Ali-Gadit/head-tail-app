const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://rwowzlziyhpqnrydvwlr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3b3d6bHppeWhwcW5yeWR2d2xyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NDgyMDYsImV4cCI6MjA5MzIyNDIwNn0.pO8RVccA-feGa_weAtegs83M05UydcG5MAq6DKgEHE0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function simulate() {
  console.log('Fetching a room...');
  const { data: room, error: fetchErr } = await supabase.from('rooms').select('*').limit(1).single();
  if (fetchErr) {
     console.error('Fetch error:', fetchErr);
     return;
  }
  
  console.log('Current status:', room.status, 'toss_call:', room.toss_call);
  
  console.log('Simulating HEADS update...');
  const { data: updated, error: updateErr } = await supabase.from('rooms').update({
     status: 'toss_throw',
     toss_call: 'head'
  }).eq('id', room.id).select().single();
  
  if (updateErr) {
     console.error('Update error:', updateErr);
  } else {
     console.log('SUCCESS! New status:', updated.status, 'toss_call:', updated.toss_call);
  }
}

simulate();
