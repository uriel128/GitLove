import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const candidates = [
  {
    email: 'katrina@gitlove.com',
    name: 'Katrina',
    occupation: 'Frontend Engineer',
    age: 25,
    hobbies: ['Bouldering', 'Latte Art', 'Street Photography'],
    editorChoice: 'VS Code',
    languageChoice: 'TypeScript',
    githubUsername: 'katrina-dev',
    vibeBadge: 'Real Developer',
    favoriteFramework: 'Next.js',
    favoriteOS: 'macOS',
    favoriteDataStructure: 'Hash Map',
    favoriteAlgorithm: 'Sliding Window',
    challengeLevel: 'EASY',
    profileImageUrl: '/images/users/Katrina.png'
  },
  {
    email: 'amara@gitlove.com',
    name: 'Amara',
    occupation: 'Platform Engineer',
    age: 27,
    hobbies: ['Running', 'Meal Prep', 'Board Games'],
    editorChoice: 'Neovim',
    languageChoice: 'Go',
    githubUsername: 'amara-ops',
    vibeBadge: 'Real Developer',
    favoriteFramework: 'Gin',
    favoriteOS: 'Linux',
    favoriteDataStructure: 'Heap',
    favoriteAlgorithm: 'Binary Search',
    challengeLevel: 'MEDIUM',
    profileImageUrl: '/images/users/Amara.png'
  },
  {
    email: 'yuna@gitlove.com',
    name: 'Yuna',
    occupation: 'Mobile Engineer',
    age: 24,
    hobbies: ['Pilates', 'Sushi Nights', 'Travel'],
    editorChoice: 'Xcode',
    languageChoice: 'Swift',
    githubUsername: 'yuna-ios',
    vibeBadge: 'Vibe Coder',
    favoriteFramework: 'SwiftUI',
    favoriteOS: 'macOS',
    favoriteDataStructure: 'Trie',
    favoriteAlgorithm: 'Two Pointers',
    challengeLevel: 'EASY',
    profileImageUrl: '/images/users/Yuna.png'
  },
  {
    email: 'julia@gitlove.com',
    name: 'Julia',
    occupation: 'Backend Developer',
    age: 29,
    hobbies: ['Hiking', 'Podcasts', 'Cycling'],
    editorChoice: 'JetBrains IDEA',
    languageChoice: 'Kotlin',
    githubUsername: 'julia-kts',
    vibeBadge: 'Real Developer',
    favoriteFramework: 'Spring Boot',
    favoriteOS: 'Linux',
    favoriteDataStructure: 'Graph',
    favoriteAlgorithm: 'Dijkstra',
    challengeLevel: 'MEDIUM',
    profileImageUrl: '/images/users/Julia.png'
  },
  {
    email: 'alana@gitlove.com',
    name: 'Alana',
    occupation: 'Data Engineer',
    age: 28,
    hobbies: ['Tennis', 'Reading', 'Cooking'],
    editorChoice: 'VS Code',
    languageChoice: 'Python',
    githubUsername: 'alana-data',
    vibeBadge: 'Real Developer',
    favoriteFramework: 'FastAPI',
    favoriteOS: 'Linux',
    favoriteDataStructure: 'Queue',
    favoriteAlgorithm: 'Dynamic Programming',
    challengeLevel: 'MEDIUM',
    profileImageUrl: '/images/users/Alana.jpg'
  },
  {
    email: 'seraphina@gitlove.com',
    name: 'Seraphina',
    occupation: 'Security Engineer',
    age: 26,
    hobbies: ['Boxing', 'Sci-Fi', 'Vinyl Records'],
    editorChoice: 'Cursor',
    languageChoice: 'Rust',
    githubUsername: 'sera-sec',
    vibeBadge: 'Real Developer',
    favoriteFramework: 'Axum',
    favoriteOS: 'Linux',
    favoriteDataStructure: 'Set',
    favoriteAlgorithm: 'DFS',
    challengeLevel: 'HARD',
    profileImageUrl: '/images/users/Seraphina.jpg'
  },
  {
    email: 'isabella@gitlove.com',
    name: 'Isabella',
    occupation: 'Full-Stack Engineer',
    age: 25,
    hobbies: ['Yoga', 'Painting', 'Live Music'],
    editorChoice: 'WebStorm',
    languageChoice: 'TypeScript',
    githubUsername: 'isabella-fs',
    vibeBadge: 'Vibe Coder',
    favoriteFramework: 'React',
    favoriteOS: 'macOS',
    favoriteDataStructure: 'Array',
    favoriteAlgorithm: 'Merge Sort',
    challengeLevel: 'EASY',
    profileImageUrl: '/images/users/Isabella.jpg'
  },
  {
    email: 'mei@gitlove.com',
    name: 'Mei',
    occupation: 'AI Engineer',
    age: 27,
    hobbies: ['Piano', 'Chess', 'Trail Running'],
    editorChoice: 'Zed',
    languageChoice: 'Python',
    githubUsername: 'mei-ml',
    vibeBadge: 'Real Developer',
    favoriteFramework: 'PyTorch',
    favoriteOS: 'Linux',
    favoriteDataStructure: 'Matrix',
    favoriteAlgorithm: 'Backtracking',
    challengeLevel: 'HARD',
    profileImageUrl: '/images/users/Mei.jpg'
  },
  {
    email: 'sloane@gitlove.com',
    name: 'Sloane',
    occupation: 'Cloud Engineer',
    age: 30,
    hobbies: ['Camping', 'Skiing', 'Game Nights'],
    editorChoice: 'VS Code',
    languageChoice: 'Go',
    githubUsername: 'sloane-cloud',
    vibeBadge: 'Real Developer',
    favoriteFramework: 'Terraform',
    favoriteOS: 'Linux',
    favoriteDataStructure: 'Tree',
    favoriteAlgorithm: 'Greedy',
    challengeLevel: 'MEDIUM',
    profileImageUrl: '/images/users/Sloane.jpg'
  },
  {
    email: 'nadia@gitlove.com',
    name: 'Nadia',
    occupation: 'Frontend Architect',
    age: 26,
    hobbies: ['Dancing', 'Coffee Roasting', 'Journaling'],
    editorChoice: 'VS Code',
    languageChoice: 'TypeScript',
    githubUsername: 'nadia-ui',
    vibeBadge: 'Vibe Coder',
    favoriteFramework: 'Vue',
    favoriteOS: 'macOS',
    favoriteDataStructure: 'Linked List',
    favoriteAlgorithm: 'BFS',
    challengeLevel: 'EASY',
    profileImageUrl: '/images/users/Nadia.jpg'
  },
  {
    email: 'maria@gitlove.com',
    name: 'Maria',
    occupation: 'Site Reliability Engineer',
    age: 29,
    hobbies: ['CrossFit', 'Travel', 'Poetry'],
    editorChoice: 'Neovim',
    languageChoice: 'Go',
    githubUsername: 'maria-sre',
    vibeBadge: 'Real Developer',
    favoriteFramework: 'Kubernetes',
    favoriteOS: 'Linux',
    favoriteDataStructure: 'Priority Queue',
    favoriteAlgorithm: 'Topological Sort',
    challengeLevel: 'HARD',
    profileImageUrl: '/images/users/Maria.jpg'
  }
];

async function main() {
  const { error: imageColumnProbeError } = await supabase
    .from('profiles')
    .select('profile_image_url')
    .limit(1);
  const hasProfileImageUrl = !imageColumnProbeError;

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

      const profilePayload = {
        user_id: user.id,
        occupation: c.occupation,
        age: c.age,
        hobbies: c.hobbies,
        editor_choice: c.editorChoice,
        language_choice: c.languageChoice,
        github_username: c.githubUsername,
        vibe_badge: c.vibeBadge,
        favorite_framework: c.favoriteFramework,
        favorite_os: c.favoriteOS,
        favorite_data_structure: c.favoriteDataStructure,
        favorite_algorithm: c.favoriteAlgorithm,
        challenge_level: c.challengeLevel,
        updated_at: new Date().toISOString()
      };

      if (hasProfileImageUrl) {
        profilePayload.profile_image_url = c.profileImageUrl;
      }

      await supabase.from("profiles").upsert(profilePayload, { onConflict: "user_id" });
      console.log(`Ready ${c.email}`);
    }
  }
}
main();
