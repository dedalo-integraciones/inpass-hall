import { createClient } from '@supabase/supabase-js';

const EDGE_URL = 'https://bzfbfvpiopoolafgiwrk.supabase.co/functions/v1/smart-handler';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZmJmdnBpb3Bvb2xhZmdpd3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MTMwMzUsImV4cCI6MjA5MzI4OTAzNX0.MdhhiKHj5JF10aHv-h-LYII2fh_SYXElCC10oyoUnAU';

async function createUser(email, nombre, apellido, password) {
  const res = await fetch(EDGE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`
    },
    body: JSON.stringify({ email, nombre, apellido, password, accion: 'crear_admin' })
  });
  const data = await res.json();
  console.log(`Result for ${email}:`, data);
}

async function main() {
  await createUser('admin.prueba3@gmail.com', 'Admin', 'Prueba', 'bajardepeso');
}

main().catch(console.error);
