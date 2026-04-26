import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser(email, name, occupation, languageChoice) {
  const { data: listData } = await supabase.auth.admin.listUsers();
  let user = listData?.users?.find(u => u.email === email);
  
  if (!user) {
    const { data } = await supabase.auth.admin.createUser({
      email,
      password: 'password',
      email_confirm: true,
      user_metadata: { name }
    });
    user = data.user;
    if (user) {
      await supabase.from("users").upsert({
        id: user.id, email, name, updated_at: new Date().toISOString()
      });
      await supabase.from("profiles").upsert({
        user_id: user.id,
        occupation,
        language_choice: languageChoice,
        age: 26,
        challenge_level: "EASY"
      });
      console.log(`Created ${email}`);
    }
  } else {
    console.log(`${email} already exists.`);
  }
}

async function main() {
  await createTestUser('alice@gitlove.com', 'Alice Chen', 'Frontend Engineer', 'TypeScript');
  await createTestUser('bob@gitlove.com', 'Bob Smith', 'Backend Developer', 'Go');
  console.log("Mock users ready!");
}
main();
