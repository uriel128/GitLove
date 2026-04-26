import { User } from "@/lib/types";

function hasValue(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

export function isProfileComplete(user: User | null | undefined) {
  const profile = user?.profile;
  if (!user || !hasValue(user.name) || !profile) {
    return false;
  }

  return (
    hasValue(profile.occupation) &&
    typeof profile.age === "number" &&
    profile.age >= 18 &&
    profile.hobbies.length === 3 &&
    hasValue(profile.editorChoice) &&
    hasValue(profile.languageChoice) &&
    hasValue(profile.githubUsername) &&
    hasValue(profile.vibeBadge) &&
    hasValue(profile.favoriteFramework) &&
    hasValue(profile.favoriteOS) &&
    hasValue(profile.favoriteDataStructure) &&
    hasValue(profile.favoriteAlgorithm) &&
    (profile.challengeLevel === "EASY" ||
      profile.challengeLevel === "MEDIUM" ||
      profile.challengeLevel === "HARD")
  );
}
