type AuthUserLike = {
  app_metadata?: {
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
  const role = normalizeRole(authUser?.app_metadata?.role);
  if (role === "admin") {
    return true;
  }

  const roles = authUser?.app_metadata?.roles;
  if (!Array.isArray(roles)) {
    return false;
  }

  return roles.some((candidate) => normalizeRole(candidate) === "admin");
}
