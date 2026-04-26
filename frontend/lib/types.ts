export type ChallengeDifficulty = "EASY" | "MEDIUM" | "HARD";

export type UserProfile = {
  occupation: string | null;
  age: number | null;
  hobbies: string[];
  editorChoice: string | null;
  languageChoice: string | null;
  githubUsername: string | null;
  vibeBadge: string | null;
  profileImage: string | null;
  favoriteFramework: string | null;
  favoriteOS: string | null;
  favoriteDataStructure: string | null;
  favoriteAlgorithm: string | null;
  challengeLevel: ChallengeDifficulty;
};

export type User = {
  id: string;
  email: string;
  name: string;
  profile: UserProfile | null;
};

export type Challenge = {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: ChallengeDifficulty;
  starterCode: {
    typescript?: string;
  } | null;
  testCases: unknown;
};

export type InterestRequest = {
  id: string;
  challengerId: string;
  targetId: string;
  status: "PENDING_CHALLENGER" | "PENDING_RECIPIENT" | "MATCHED" | "FAILED" | "CANCELLED";
  challenge: Challenge;
};

export type Match = {
  id: string;
  userA: { id: string; name: string };
  userB: { id: string; name: string };
  room: { id: string } | null;
};

export type ChatMessage = {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  format: "TEXT" | "MARKDOWN" | "CODE";
  createdAt: string;
  sender: {
    id: string;
    name: string;
  };
};
