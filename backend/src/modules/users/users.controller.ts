import { BadRequestException, Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ChallengeDifficulty } from "@prisma/client";
import { z } from "zod";
import { UsersService } from "./users.service";

const nullableString = z.union([z.string().min(1), z.null()]);
const createUserSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    email: z.string().trim().email().max(160)
  })
  .strict();

const updateProfileSchema = z
  .object({
    name: z.string().min(1).optional(),
    occupation: nullableString.optional(),
    age: z.number().int().min(18).max(99).nullable().optional(),
    hobbies: z.array(z.string().min(1)).max(3).optional(),
    editorChoice: nullableString.optional(),
    languageChoice: nullableString.optional(),
    githubUsername: nullableString.optional(),
    vibeBadge: nullableString.optional(),
    favoriteFramework: nullableString.optional(),
    favoriteOS: nullableString.optional(),
    favoriteDataStructure: nullableString.optional(),
    favoriteAlgorithm: nullableString.optional(),
    challengeLevel: z.nativeEnum(ChallengeDifficulty).optional()
  })
  .strict();

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  createUser(@Body() body: unknown) {
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException("Invalid user payload");
    }
    return this.usersService.createUser(parsed.data);
  }

  @Get()
  listUsers() {
    return this.usersService.listUsers();
  }

  @Get(":userId")
  getUser(@Param("userId") userId: string) {
    return this.usersService.getUser(userId);
  }

  @Patch(":userId/profile")
  updateProfile(@Param("userId") userId: string, @Body() body: unknown) {
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException("Invalid profile payload");
    }
    return this.usersService.updateProfile(userId, parsed.data);
  }
}
