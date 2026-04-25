import { Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SupabaseAuthGuard } from "./supabase-auth.guard";
import { AuthenticatedRequest } from "./auth.types";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(SupabaseAuthGuard)
  @Get("me")
  async getMe(@Req() request: AuthenticatedRequest) {
    const authUser = request.authUser!;
    const appUser = await this.authService.syncAppUser(authUser);

    return {
      authUser,
      appUser
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Post("sync")
  async sync(@Req() request: AuthenticatedRequest) {
    const authUser = request.authUser!;
    const appUser = await this.authService.syncAppUser(authUser);

    return { appUser };
  }
}
