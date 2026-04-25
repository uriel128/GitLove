import { Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { FirebaseAuthGuard } from "./firebase-auth.guard";
import { AuthenticatedRequest } from "./auth.types";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(FirebaseAuthGuard)
  @Get("me")
  async getMe(@Req() request: AuthenticatedRequest) {
    const authUser = request.authUser!;
    const appUser = await this.authService.syncAppUser(authUser);

    return {
      authUser,
      appUser
    };
  }

  @UseGuards(FirebaseAuthGuard)
  @Post("sync")
  async sync(@Req() request: AuthenticatedRequest) {
    const authUser = request.authUser!;
    const appUser = await this.authService.syncAppUser(authUser);

    return { appUser };
  }
}
