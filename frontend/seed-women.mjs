import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const candidates = [
  { email: 'sarah@gitlove.com', name: 'Sarah Jenkins', occupation: 'Data Scientist', lang: 'Python', framework: 'TensorFlow', os: 'Linux', algo: 'Neural Nets', img: '/images/mock_profiles/female_engineer_6.png' },
  { email: 'chloe@gitlove.com', name: 'Chloe Adams', occupation: 'Mobile Developer', lang: 'Swift', framework: 'SwiftUI', os: 'macOS', algo: 'Dijkstra', img: '/images/mock_profiles/female_engineer_7.png' },
  { email: 'olivia@gitlove.com', name: 'Olivia Parker', occupation: 'UI/UX & Frontend', lang: 'TypeScript', framework: 'React', os: 'macOS', algo: 'A* Search', img: '/images/mock_profiles/female_engineer_8.png' },
  { email: 'emma@gitlove.com', name: 'Emma Davis', occupation: 'DevOps Engineer', lang: 'Go', framework: 'Kubernetes', os: 'Linux', algo: 'Raft Consensus', img: '/images/mock_profiles/female_engineer_9.png' },
  { email: 'mia2@gitlove.com', name: 'Mia Rodriguez', occupation: 'Software Engineer', lang: 'Rust', framework: 'Actix', os: 'macOS', algo: 'Binary Search', img: '/images/mock_profiles/female_engineer_10.png' },
  { email: 'nora@gitlove.com', name: 'Nora Smith', occupation: 'Frontend Engineer', lang: 'TypeScript', framework: 'Next.js', os: 'macOS', algo: 'Two Pointers', img: '/images/mock_profiles/female_engineer_1.png' },
  { email: 'elena@gitlove.com', name: 'Elena Vance', occupation: 'Frontend Developer', lang: 'JavaScript', framework: 'Vue', os: 'Windows', algo: 'Merge Sort', img: '/images/mock_profiles/female_engineer_2.png' },
  { email: 'isabella@gitlove.com', name: 'Isabella Moore', occupation: 'Backend Architect', lang: 'Java', framework: 'Spring Boot', os: 'macOS', algo: 'Kruskal', img: '/images/mock_profiles/female_engineer_3.png' },
  { email: 'ava@gitlove.com', name: 'Ava Taylor', occupation: 'Full Stack Developer', lang: 'TypeScript', framework: 'SvelteKit', os: 'Linux', algo: 'Dynamic Programming', img: '/images/mock_profiles/female_engineer_4.png' },
  { email: 'sophia@gitlove.com', name: 'Sophia Chen', occupation: 'Software Engineer', lang: 'C++', framework: 'Qt', os: 'Linux', algo: 'Quick Sort', img: '/images/mock_profiles/female_engineer_5.png' }
];

async function main() {
  const { data: listData } = await supabase.auth.admin.listUsers();
  
  for (const c of candidates) {
    let user = listData?.users?.find(u => u.email === c.email);
    if (!user) {
      const { data } = await supabase.auth.admin.createUser({
        email: c.email,
        password: 'password',
        email_confirm: true,
        user_metadata: { name: c.name }
      });
      user = data.user;
    }
    
    if (user) {
      await supabase.from("users").upsert({
        id: user.id, email: c.email, name: c.name, updated_at: new Date().toISOString()
      });
      await supabase.from("profiles").upsert({
        user_id: user.id,
        occupation: c.occupation,
        language_choice: c.lang,
        favorite_framework: c.framework,
        favorite_os: c.os,
        favorite_algorithm: c.algo,
        vibe_badge: c.img, // Hack: Storing image URL in vibe_badge field
        age: Math.floor(Math.random() * 10) + 22,
        challenge_level: "EASY"
      });
      console.log(`Ready ${c.email}`);
    }
  }
}
main();
