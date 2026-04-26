import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Error listing users:", listError);
    process.exit(1);
  }
  
  const adminEmail = 'admin@gitlove.com';
  const existingUser = usersData.users.find(u => u.email === adminEmail);
  
  if (existingUser) {
    console.log(`User ${adminEmail} already exists! ID: ${existingUser.id}`);
    
    // Update password to ensure it matches
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      { password: 'password', user_metadata: { name: 'Admin' }, email_confirm: true }
    );
    if (updateError) {
      console.error("Failed to update password:", updateError);
    } else {
      console.log("Password explicitly set to 'password' and email confirmed.");
    }
  } else {
    console.log(`User ${adminEmail} does not exist. Creating...`);
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: 'password',
      email_confirm: true,
      user_metadata: { name: 'Admin' }
    });
    
    if (error) {
      console.error("Error creating user:", error);
    } else {
      console.log("Successfully created user:", data.user.id);
    }
  }
}

main();
