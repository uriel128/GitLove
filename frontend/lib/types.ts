export type ChallengeDifficulty = "EASY" | "MEDIUM" | "HARD";
export type ProfileGender = "MALE" | "FEMALE";

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
  gender: ProfileGender | null;
  locationText: string | null;
  latitude: number | null;
  longitude: number | null;
  challengeLevel: ChallengeDifficulty;
};

export type User = {
  id: string;
  email: string;
  name: string;
  profile: UserProfile | null;
};

export type AdminManagedUser = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastSignInAt: string | null;
  bannedUntil: string | null;
  providers: string[];
  hasProfile: boolean;
  profileImage: string | null;
  occupation: string | null;
  gender: ProfileGender | null;
  locationText: string | null;
  challengeLevel: ChallengeDifficulty | null;
};

export type Challenge = {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: ChallengeDifficulty;
  starterCode: Record<string, string> | null;
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
  userA: { id: string; name: string; profileImage: string | null };
  userB: { id: string; name: string; profileImage: string | null };
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
