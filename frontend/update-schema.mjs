import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { error } = await supabase.rpc('exec_sql', { sql: 'alter table public.profiles add column if not exists profile_image_url text;' });
  if (error) {
    console.log("Could not run rpc exec_sql, trying to create function first.");
  } else {
    console.log("Column added successfully via RPC.");
    return;
  }
}
main();
