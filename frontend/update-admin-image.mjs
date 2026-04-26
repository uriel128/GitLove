import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: listData } = await supabase.auth.admin.listUsers();
  const adminUser = listData?.users?.find(u => u.email === 'admin@gitlove.com');
  
  if (adminUser) {
    await supabase.from("profiles").upsert({
      user_id: adminUser.id,
      vibe_badge: '/images/admin.png'
    });
    console.log("Admin image updated");
  } else {
    console.log("Admin user not found");
  }
}
main();
