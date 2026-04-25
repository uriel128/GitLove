import { Injectable, UnauthorizedException } from "@nestjs/common";
import { DecodedIdToken, getAuth } from "firebase-admin/auth";
import { App, cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { env } from "../../config/env";
import { PrismaService } from "../prisma/prisma.service";
import { AuthUser } from "./auth.types";

@Injectable()
export class AuthService {
  private readonly firebaseApp: App | null;

  constructor(private readonly prisma: PrismaService) {
    if (!env.FIREBASE_PROJECT_ID) {
      this.firebaseApp = null;
      return;
    }

    this.firebaseApp = getOrCreateFirebaseApp();
  }

  async verifyBearerToken(token: string): Promise<AuthUser> {
    if (!this.firebaseApp) {
      throw new UnauthorizedException("Firebase auth is not configured on the backend");
    }

    let decoded: DecodedIdToken;
    try {
      decoded = await getAuth(this.firebaseApp).verifyIdToken(token);
    } catch {
      throw new UnauthorizedException("Invalid Firebase ID token");
    }

    const email = decoded.email;
    if (!email) {
      throw new UnauthorizedException("Firebase user email is required");
    }

    const displayName =
      firstString(decoded.name) ??
      email.split("@")[0];

    return {
      firebaseUserId: decoded.uid,
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

function getOrCreateFirebaseApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  if (env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    return initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      }),
      projectId: env.FIREBASE_PROJECT_ID
    });
  }

  return initializeApp({
    projectId: env.FIREBASE_PROJECT_ID
  });
}
