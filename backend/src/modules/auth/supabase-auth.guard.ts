import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthenticatedRequest } from "./auth.types";

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const headerValue = request.headers["authorization"];
    const rawAuthorization = Array.isArray(headerValue) ? headerValue[0] : headerValue;

    if (typeof rawAuthorization !== "string") {
      throw new UnauthorizedException("Missing Authorization header");
    }

    const [scheme, token] = rawAuthorization.split(" ");
    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedException("Expected Bearer token");
    }

    request.authUser = await this.authService.verifyBearerToken(token);
    return true;
  }
}
