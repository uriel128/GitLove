"use client";

import { useQuery } from "@tanstack/react-query";
import { RequireAuth } from "@/components/require-auth";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { User } from "@/lib/types";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase() ?? "";

export default function AdminPage() {
  const { currentUser } = useAuth();
  const normalizedEmail = currentUser?.email.trim().toLowerCase() ?? "";
  const isAdmin = Boolean(ADMIN_EMAIL) && normalizedEmail === ADMIN_EMAIL;

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.get<User[]>("/users"),
    enabled: isAdmin
  });

  return (
    <RequireAuth>
      <div className="space-y-4">
        <section className="rounded-md border border-line bg-panel p-4">
          <h1 className="text-lg font-semibold">Admin / Accounts</h1>
          <div className="mt-1 text-xs text-muted">
            Signed in as {currentUser?.email ?? "unknown"}
          </div>
        </section>

        {!ADMIN_EMAIL ? (
          <section className="rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
            `NEXT_PUBLIC_ADMIN_EMAIL` is not configured, so admin access is disabled.
          </section>
        ) : null}

        {ADMIN_EMAIL && !isAdmin ? (
          <section className="rounded-md border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100">
            This account is not the configured admin user.
          </section>
        ) : null}

        {isAdmin ? (
          <section className="rounded-md border border-line bg-panel p-4">
            <h2 className="text-sm font-semibold">Known Accounts</h2>
            {usersQuery.isLoading ? (
              <div className="mt-3 text-sm text-muted">Loading accounts...</div>
            ) : null}
            {usersQuery.isError ? (
              <div className="mt-3 text-sm text-rose-300">
                Failed to load accounts: {usersQuery.error.message}
              </div>
            ) : null}
            {usersQuery.data ? (
              <div className="mt-3 space-y-2">
                {usersQuery.data.map((user) => (
                  <div
                    key={user.id}
                    className="rounded-md border border-line bg-panelAlt px-3 py-2 text-sm"
                  >
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-muted">{user.email}</div>
                    <div className="mt-1 text-xs text-muted">
                      {user.profile?.occupation ?? "No profile yet"} · {user.profile?.challengeLevel ?? "EASY"}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </RequireAuth>
  );
}
