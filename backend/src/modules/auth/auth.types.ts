export type AuthUser = {
  supabaseUserId: string;
  email: string;
  displayName: string;
};

export type AuthenticatedRequest = {
  headers: Record<string, string | string[] | undefined>;
  authUser?: AuthUser;
};
