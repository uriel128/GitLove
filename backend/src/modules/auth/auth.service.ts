import { Injectable, UnauthorizedException } from "@nestjs/common";
import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { env } from "../../config/env";
import { PrismaService } from "../prisma/prisma.service";
import { AuthUser } from "./auth.types";

@Injectable()
export class AuthService {
  private readonly supabaseClient: SupabaseClient | null;

  constructor(private readonly prisma: PrismaService) {
    if (!env.SUPABASE_URL || (!env.SUPABASE_ANON_KEY && !env.SUPABASE_SERVICE_ROLE_KEY)) {
      this.supabaseClient = null;
      return;
    }

    this.supabaseClient = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }

  async verifyBearerToken(token: string): Promise<AuthUser> {
    if (!this.supabaseClient) {
      throw new UnauthorizedException("Supabase auth is not configured on the backend");
    }

    const { data, error } = await this.supabaseClient.auth.getUser(token);
    if (error || !data.user) {
      throw new UnauthorizedException("Invalid Supabase access token");
    }

    const email = data.user.email;
    if (!email) {
      throw new UnauthorizedException("Supabase user email is required");
    }

    const displayName =
      firstString(data.user.user_metadata?.full_name) ??
      firstString(data.user.user_metadata?.name) ??
      firstString(data.user.user_metadata?.user_name) ??
      email.split("@")[0];

    return {
      supabaseUserId: data.user.id,
      email,
      displayName
    };
  }

  async syncAppUser(authUser: AuthUser) {
    const existing = await this.prisma.user.findUnique({
      where: { email: authUser.email }
    });

    if (existing) {
      if (existing.name !== authUser.displayName) {
        return this.prisma.user.update({
          where: { id: existing.id },
          data: { name: authUser.displayName },
          include: { profile: true }
        });
      }

      return this.prisma.user.findUniqueOrThrow({
        where: { id: existing.id },
        include: { profile: true }
      });
    }

    return this.prisma.user.create({
      data: {
        email: authUser.email,
        name: authUser.displayName
      },
      include: { profile: true }
    });
  }
}

function firstString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
