import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bzfbfvpiopoolafgiwrk.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZmJmdnBpb3Bvb2xhZmdpd3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MTMwMzUsImV4cCI6MjA5MzI4OTAzNX0.MdhhiKHj5JF10aHv-h-LYII2fh_SYXElCC10oyoUnAU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

async function main() {
  const email = 'admin.prueba@gmail.com';
  const password = 'bajardepeso';

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (authError) {
      console.log('Error login', authError);
      return;
  }
  
  console.log('Logged in as user');

  const { data: accData, error: accError } = await supabase
    .from('acceso')
    .insert({
      email,
      nombre: 'Admin',
      apellido: 'Prueba',
      nivel: 'ADMIN',
      activo: true
    });
    
  if (accError) {
    console.error('Error inserting into acceso:', accError);
  } else {
    console.log('Inserted into acceso.');
  }
}

main().catch(console.error);
