type AuthUserLike = {
  email?: string | null;
  app_metadata?: {
    role?: unknown;
    roles?: unknown;
  } | null;
  user_metadata?: {
    role?: unknown;
    roles?: unknown;
  } | null;
} | null;

function normalizeRole(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

export function hasAdminRoleFromAuthUser(authUser: AuthUserLike) {
  const email = authUser?.email?.trim().toLowerCase() ?? "";
  if (email === "admin@gitlove.com") {
    return true;
  }

  const appRole = normalizeRole(authUser?.app_metadata?.role);
  if (appRole === "admin") {
    return true;
  }

  const userRole = normalizeRole(authUser?.user_metadata?.role);
  if (userRole === "admin") {
    return true;
  }

  const appRoles = authUser?.app_metadata?.roles;
  if (Array.isArray(appRoles) && appRoles.some((candidate) => normalizeRole(candidate) === "admin")) {
    return true;
  }

  const userRoles = authUser?.user_metadata?.roles;
  if (Array.isArray(userRoles) && userRoles.some((candidate) => normalizeRole(candidate) === "admin")) {
    return true;
  }

  return false;
}
