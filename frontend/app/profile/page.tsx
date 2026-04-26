"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { User } from "@/lib/types";
import { Pencil, Save } from "lucide-react";

type ProfileForm = {
  name: string;
  occupation: string;
  age: string;
  hobbies: string;
  editorChoice: string;
  languageChoice: string;
  githubUsername: string;
  vibeBadge: string;
  favoriteFramework: string;
  favoriteOS: string;
  favoriteDataStructure: string;
  favoriteAlgorithm: string;
  challengeLevel: "EASY" | "MEDIUM" | "HARD";
};

const initialForm: ProfileForm = {
  name: "",
  occupation: "",
  age: "",
  hobbies: "",
  editorChoice: "",
  languageChoice: "",
  githubUsername: "",
  vibeBadge: "",
  favoriteFramework: "",
  favoriteOS: "",
  favoriteDataStructure: "",
  favoriteAlgorithm: "",
  challengeLevel: "EASY"
};

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { changePassword, currentUserId } = useAuth();
  const [form, setForm] = useState<ProfileForm>(initialForm);
  const [status, setStatus] = useState("No changes");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("No password update requested");
  const [editing, setEditing] = useState(false);

  const userQuery = useQuery({
    queryKey: ["user", currentUserId],
    queryFn: () => api.get<User>(`/users/${currentUserId}`),
    enabled: Boolean(currentUserId)
  });
  const user = userQuery.data ?? null;

  useEffect(() => {
    if (!user) return;

    setForm({
      name: user.name,
      occupation: user.profile?.occupation ?? "",
      age: user.profile?.age?.toString() ?? "",
      hobbies: user.profile?.hobbies?.join(", ") ?? "",
      editorChoice: user.profile?.editorChoice ?? "",
      languageChoice: user.profile?.languageChoice ?? "",
      githubUsername: user.profile?.githubUsername ?? "",
      vibeBadge: user.profile?.vibeBadge ?? "",
      favoriteFramework: user.profile?.favoriteFramework ?? "",
      favoriteOS: user.profile?.favoriteOS ?? "",
      favoriteDataStructure: user.profile?.favoriteDataStructure ?? "",
      favoriteAlgorithm: user.profile?.favoriteAlgorithm ?? "",
      challengeLevel: user.profile?.challengeLevel ?? "EASY"
    });
  }, [user]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId) {
        throw new Error("No signed-in user");
      }

      const hobbies = form.hobbies
        .split(",")
        .map((hobby) => hobby.trim())
        .filter(Boolean)
        .slice(0, 3);

      return api.patch(`/users/${currentUserId}/profile`, {
        name: form.name,
        occupation: nullable(form.occupation),
        age: form.age ? Number(form.age) : null,
        hobbies,
        editorChoice: nullable(form.editorChoice),
        languageChoice: nullable(form.languageChoice),
        githubUsername: nullable(form.githubUsername),
        vibeBadge: nullable(form.vibeBadge),
        favoriteFramework: nullable(form.favoriteFramework),
        favoriteOS: nullable(form.favoriteOS),
        favoriteDataStructure: nullable(form.favoriteDataStructure),
        favoriteAlgorithm: nullable(form.favoriteAlgorithm),
        challengeLevel: form.challengeLevel
      });
    },
    onSuccess: async () => {
      setStatus("Profile saved");
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      await queryClient.invalidateQueries({ queryKey: ["user", currentUserId] });
      setEditing(false);
    },
    onError: (error) => {
      setStatus(`Save failed: ${error.message}`);
    }
  });

  const passwordMutation = useMutation({
    mutationFn: async () => {
      const trimmedPassword = newPassword.trim();
      const trimmedConfirmation = confirmPassword.trim();

      if (!trimmedPassword) {
        throw new Error("Enter a new password");
      }

      if (trimmedPassword !== trimmedConfirmation) {
        throw new Error("Passwords do not match");
      }

      await changePassword(trimmedPassword);
    },
    onSuccess: () => {
      setNewPassword("");
      setConfirmPassword("");
      setPasswordStatus("Password updated");
    },
    onError: (error) => {
      setPasswordStatus(`Password update failed: ${error.message}`);
    }
  });
=======
  const profileImage = user?.profile?.profileImage || "/images/admin.png";
  const details = useMemo(
    () => [
      ["Occupation", user?.profile?.occupation || "Not set"],
      ["Language", user?.profile?.languageChoice || "Not set"],
      ["Framework", user?.profile?.favoriteFramework || "Not set"],
      ["OS", user?.profile?.favoriteOS || "Not set"],
      ["Data Structure", user?.profile?.favoriteDataStructure || "Not set"],
      ["Algorithm", user?.profile?.favoriteAlgorithm || "Not set"],
      ["Editor", user?.profile?.editorChoice || "Not set"],
      ["Vibe", user?.profile?.vibeBadge || "Not set"],
      ["GitHub", user?.profile?.githubUsername || "Not set"],
      ["Challenge Level", user?.profile?.challengeLevel || "EASY"],
      ["Hobbies", user?.profile?.hobbies?.join(", ") || "Not set"]
    ],
    [user]
  );

  return (
    <RequireAuth>
      <div className="mx-auto max-w-5xl p-4 md:p-6">
        <div className="grid gap-6 lg:grid-cols-[460px_1fr]">
          <section className="mx-auto w-full max-w-[460px]">
            <div className="h-[72vh] min-h-[620px] overflow-hidden rounded-[2.2rem] border border-line bg-panel shadow-2xl">
              <img src={profileImage} alt={user?.name ?? "Profile"} className="h-full w-full object-cover" />
            </div>
          </section>

          <section className="rounded-3xl border border-line bg-gradient-to-b from-panel to-panelAlt p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-text">
                  {user?.name ?? "Profile"}
                  <span className="ml-2 text-base font-medium text-muted">
                    {user?.profile?.age ? `${user.profile.age}` : ""}
                  </span>
                </h2>
                <p className="text-sm text-muted mt-0.5">{user?.profile?.occupation || "Occupation not set"}</p>
                <p className="text-sm text-muted">{status}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditing((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-panelAlt px-4 py-2 text-sm text-text"
              >
                <Pencil className="h-4 w-4" />
                {editing ? "Close" : "Edit"}
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-line bg-gradient-to-r from-panelAlt to-panel p-4">
              <div className="grid grid-cols-1 gap-2.5">
                {details.map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-3 text-sm">
                    <span className="text-muted">{label}</span>
                    <span className="text-right font-medium text-text">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {!editing ? (
              <div className="mt-6 rounded-2xl border border-line bg-panelAlt p-5 text-sm text-muted">
                Tap <span className="text-text font-medium">Edit</span> to update attributes.
              </div>
            ) : (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <Input label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
                <Input label="Occupation" value={form.occupation} onChange={(v) => setForm((f) => ({ ...f, occupation: v }))} />
                <Input label="Age" value={form.age} onChange={(v) => setForm((f) => ({ ...f, age: v }))} />
                <Input label="Hobbies (comma-separated, max 3)" value={form.hobbies} onChange={(v) => setForm((f) => ({ ...f, hobbies: v }))} />
                <Input label="IDE / Editor Choice" value={form.editorChoice} onChange={(v) => setForm((f) => ({ ...f, editorChoice: v }))} />
                <Input label="Programming Language" value={form.languageChoice} onChange={(v) => setForm((f) => ({ ...f, languageChoice: v }))} />
                <Input label="GitHub Username" value={form.githubUsername} onChange={(v) => setForm((f) => ({ ...f, githubUsername: v }))} />
                <Input label="Vibe Badge" value={form.vibeBadge} onChange={(v) => setForm((f) => ({ ...f, vibeBadge: v }))} />
                <Input label="Favorite Framework" value={form.favoriteFramework} onChange={(v) => setForm((f) => ({ ...f, favoriteFramework: v }))} />
                <Input label="Favorite OS" value={form.favoriteOS} onChange={(v) => setForm((f) => ({ ...f, favoriteOS: v }))} />
                <Input label="Favorite Data Structure" value={form.favoriteDataStructure} onChange={(v) => setForm((f) => ({ ...f, favoriteDataStructure: v }))} />
                <Input label="Favorite Algorithm" value={form.favoriteAlgorithm} onChange={(v) => setForm((f) => ({ ...f, favoriteAlgorithm: v }))} />
                <div className="md:col-span-2">
                  <label className="text-xs text-muted">Challenge Level</label>
                  <select
                    value={form.challengeLevel}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        challengeLevel: event.target.value as "EASY" | "MEDIUM" | "HARD"
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-line bg-panelAlt px-3 py-2 text-sm text-text"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>
            )}

            {editing ? (
              <button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={!currentUserId || saveMutation.isPending}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saveMutation.isPending ? "Saving..." : "Save Profile"}
              </button>
            ) : null}

            <section className="mt-6 rounded-2xl border border-line bg-panel p-4">
              <h2 className="text-lg font-semibold text-text">Change Password</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Input
                  label="New Password"
                  value={newPassword}
                  onChange={setNewPassword}
                  type="password"
                />
                <Input
                  label="Confirm Password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  type="password"
                />
              </div>
              <div className="mt-2 text-xs text-muted">{passwordStatus}</div>
              <button
                type="button"
                onClick={() => passwordMutation.mutate()}
                disabled={!currentUserId || passwordMutation.isPending}
                className="mt-4 rounded-md border border-accent/60 bg-accent/10 px-4 py-2 text-sm text-accent disabled:opacity-50"
              >
                {passwordMutation.isPending ? "Updating..." : "Update Password"}
              </button>
            </section>
          </section>
        </div>
      </div>
    </RequireAuth>
  );
}

function nullable(value: string) {
  return value.trim() ? value.trim() : null;
}

function Input({
  label,
  value,
  onChange,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "password";
}) {
  return (
    <div>
      <label className="text-xs text-muted">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        className="mt-1 w-full rounded-md border border-line bg-panelAlt px-3 py-2 text-sm"
      />
    </div>
  );
}
