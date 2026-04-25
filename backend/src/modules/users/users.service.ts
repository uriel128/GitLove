import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { ChallengeDifficulty, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

type CreateUserInput = {
  name: string;
  email: string;
};

type UpdateProfileInput = {
  name?: string;
  occupation?: string | null;
  age?: number | null;
  hobbies?: string[];
  editorChoice?: string | null;
  languageChoice?: string | null;
  githubUsername?: string | null;
  vibeBadge?: string | null;
  favoriteFramework?: string | null;
  favoriteOS?: string | null;
  favoriteDataStructure?: string | null;
  favoriteAlgorithm?: string | null;
  challengeLevel?: ChallengeDifficulty;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(input: CreateUserInput) {
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();

    try {
      const created = await this.prisma.user.create({
        data: {
          email,
          name
        },
        include: { profile: true }
      });

      return {
        ...created,
        profile: created.profile
          ? {
              ...created.profile,
              hobbies: normalizeHobbies(created.profile.hobbies)
            }
          : null
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("A user with that email already exists");
      }

      throw error;
    }
  }

  async listUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        profile: {
          select: {
            occupation: true,
            age: true,
            hobbies: true,
            editorChoice: true,
            languageChoice: true,
            githubUsername: true,
            vibeBadge: true,
            favoriteFramework: true,
            favoriteOS: true,
            favoriteDataStructure: true,
            favoriteAlgorithm: true,
            challengeLevel: true
          }
        }
      }
    });

    return users.map((user) => ({
      ...user,
      profile: user.profile
        ? {
            ...user.profile,
            hobbies: normalizeHobbies(user.profile.hobbies)
          }
        : null
    }));
  }

  async getUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return {
      ...user,
      profile: user.profile
        ? {
            ...user.profile,
            hobbies: normalizeHobbies(user.profile.hobbies)
          }
        : null
    };
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.prisma.$transaction(async (tx) => {
      if (typeof input.name === "string") {
        await tx.user.update({
          where: { id: userId },
          data: { name: input.name }
        });
      }

      const hobbiesJson = input.hobbies
        ? (input.hobbies as Prisma.InputJsonValue)
        : undefined;

      const updateData: Prisma.ProfileUncheckedUpdateInput = {
        occupation: input.occupation,
        age: input.age,
        hobbies: hobbiesJson,
        editorChoice: input.editorChoice,
        languageChoice: input.languageChoice,
        githubUsername: input.githubUsername,
        vibeBadge: input.vibeBadge,
        favoriteFramework: input.favoriteFramework,
        favoriteOS: input.favoriteOS,
        favoriteDataStructure: input.favoriteDataStructure,
        favoriteAlgorithm: input.favoriteAlgorithm,
        challengeLevel: input.challengeLevel
      };

      const createData: Prisma.ProfileUncheckedCreateInput = {
        userId,
        occupation: input.occupation ?? null,
        age: input.age ?? null,
        hobbies: (input.hobbies ?? []) as Prisma.InputJsonValue,
        editorChoice: input.editorChoice ?? null,
        languageChoice: input.languageChoice ?? null,
        githubUsername: input.githubUsername ?? null,
        vibeBadge: input.vibeBadge ?? null,
        favoriteFramework: input.favoriteFramework ?? null,
        favoriteOS: input.favoriteOS ?? null,
        favoriteDataStructure: input.favoriteDataStructure ?? null,
        favoriteAlgorithm: input.favoriteAlgorithm ?? null,
        challengeLevel: input.challengeLevel ?? ChallengeDifficulty.EASY
      };

      await tx.profile.upsert({
        where: { userId },
        update: updateData,
        create: createData
      });

      const updated = await tx.user.findUnique({
        where: { id: userId },
        include: { profile: true }
      });

      if (!updated) {
        throw new NotFoundException("User not found");
      }

      return {
        ...updated,
        profile: updated.profile
          ? {
              ...updated.profile,
              hobbies: normalizeHobbies(updated.profile.hobbies)
            }
          : null
      };
    });
  }
}

function normalizeHobbies(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 3);
}
