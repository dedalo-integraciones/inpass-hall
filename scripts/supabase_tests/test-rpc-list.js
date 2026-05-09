import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bzfbfvpiopoolafgiwrk.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZmJmdnBpb3Bvb2xhZmdpd3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MTMwMzUsImV4cCI6MjA5MzI4OTAzNX0.MdhhiKHj5JF10aHv-h-LYII2fh_SYXElCC10oyoUnAU';
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function main() {
  const { data, error } = await supabase.rpc('crear_admin', { email: 'test' });
  console.log('rpc crear_admin:', error || data);
  const { data: d2, error: e2 } = await supabase.rpc('create_admin');
  console.log('rpc create_admin:', e2 || d2);
}
main();
