import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bzfbfvpiopoolafgiwrk.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZmJmdnBpb3Bvb2xhZmdpd3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MTMwMzUsImV4cCI6MjA5MzI4OTAzNX0.MdhhiKHj5JF10aHv-h-LYII2fh_SYXElCC10oyoUnAU';
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function main() {
  const { data, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'dedalo.integraciones@gmail.com', // SADMIN
    password: 'bajardepeso' // let's see if this works, if we know it
  });

  if (loginError) {
      console.log('Cant login as SADMIN', loginError);
  } else {
      console.log('Logged in as SADMIN!');
      const { error } = await supabase.from('acceso').insert({
          email: 'admin.prueba6@gmail.com',
          nombre: 'Admin6',
          apellido: 'Test',
          nivel: 'ADMIN',
          activo: true
      });
      console.log('Insert result:', error || 'SUCCESS');
  }
}
main();
