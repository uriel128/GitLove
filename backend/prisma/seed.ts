import { PrismaClient, ChallengeDifficulty } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.chatMessage.deleteMany();
  await prisma.chatRoom.deleteMany();
  await prisma.match.deleteMany();
  await prisma.challengeAttempt.deleteMany();
  await prisma.interestRequest.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.challenge.deleteMany();

  const [alice, bob, carol] = await Promise.all([
    prisma.user.create({
      data: {
        email: "alice@gitlove.dev",
        name: "Alice",
        profile: {
          create: {
            occupation: "Backend Engineer",
            age: 26,
            hobbies: ["Chess", "Coffee roasting", "Running"],
            editorChoice: "VS Code",
            languageChoice: "TypeScript",
            githubUsername: "alice-dev",
            vibeBadge: "Real Developer",
            favoriteFramework: "NestJS",
            favoriteOS: "macOS",
            favoriteDataStructure: "Hash Map",
            favoriteAlgorithm: "Dijkstra",
            challengeLevel: ChallengeDifficulty.MEDIUM
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        email: "bob@gitlove.dev",
        name: "Bob",
        profile: {
          create: {
            occupation: "SRE",
            age: 29,
            hobbies: ["Gaming", "Bouldering", "Hiking"],
            editorChoice: "Vim",
            languageChoice: "Go",
            githubUsername: "bob-ops",
            vibeBadge: "Real Developer",
            favoriteFramework: "Fastify",
            favoriteOS: "Linux",
            favoriteDataStructure: "Heap",
            favoriteAlgorithm: "BFS",
            challengeLevel: ChallengeDifficulty.MEDIUM
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        email: "carol@gitlove.dev",
        name: "Carol",
        profile: {
          create: {
            occupation: "Frontend Engineer",
            age: 25,
            hobbies: ["Photography", "Gym", "Board games"],
            editorChoice: "WebStorm",
            languageChoice: "TypeScript",
            githubUsername: "carol-ui",
            vibeBadge: "Vibe Coder",
            favoriteFramework: "Next.js",
            favoriteOS: "macOS",
            favoriteDataStructure: "Trie",
            favoriteAlgorithm: "Dynamic Programming",
            challengeLevel: ChallengeDifficulty.EASY
          }
        }
      }
    })
  ]);

  await prisma.challenge.createMany({
    data: [
      {
        slug: "two-sum",
        title: "Two Sum",
        difficulty: ChallengeDifficulty.EASY,
        description:
          "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        starterCode: {
          typescript:
            "function twoSum(nums: number[], target: number): number[] {\n  return [];\n}"
        },
        testCases: [
          { input: { nums: [2, 7, 11, 15], target: 9 }, output: [0, 1] },
          { input: { nums: [3, 2, 4], target: 6 }, output: [1, 2] }
        ]
      },
      {
        slug: "longest-substring-without-repeating-characters",
        title: "Longest Substring Without Repeating Characters",
        difficulty: ChallengeDifficulty.MEDIUM,
        description:
          "Given a string s, find the length of the longest substring without repeating characters.",
        starterCode: {
          typescript:
            "function lengthOfLongestSubstring(s: string): number {\n  return 0;\n}"
        },
        testCases: [
          { input: "abcabcbb", output: 3 },
          { input: "bbbbb", output: 1 },
          { input: "pwwkew", output: 3 }
        ]
      },
      {
        slug: "merge-k-sorted-lists",
        title: "Merge K Sorted Lists",
        difficulty: ChallengeDifficulty.HARD,
        description:
          "You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all lists into one sorted linked-list and return it.",
        starterCode: {
          typescript:
            "function mergeKLists(lists: number[][]): number[] {\n  return [];\n}"
        },
        testCases: [
          { input: [[1, 4, 5], [1, 3, 4], [2, 6]], output: [1, 1, 2, 3, 4, 4, 5, 6] },
          { input: [], output: [] }
        ]
      }
    ]
  });

  console.log("Seed complete");
  console.log({
    users: [alice.email, bob.email, carol.email]
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
