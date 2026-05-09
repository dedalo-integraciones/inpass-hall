import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bzfbfvpiopoolafgiwrk.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZmJmdnBpb3Bvb2xhZmdpd3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MTMwMzUsImV4cCI6MjA5MzI4OTAzNX0.MdhhiKHj5JF10aHv-h-LYII2fh_SYXElCC10oyoUnAU';
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function main() {
  await supabase.auth.signInWithPassword({
    email: 'dedalo.integraciones@gmail.com',
    password: 'bajardepeso'
  });
  
  const { data, error } = await supabase.from('pacientes').select('*').eq('email', 'admin.prueba4@gmail.com');
  console.log('Pacientes:', error || data);
}
main();
