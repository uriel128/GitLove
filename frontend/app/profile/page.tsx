"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { RequireAuth } from "@/components/require-auth";
import { User } from "@/lib/types";

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
  const [userId, setUserId] = useState("");
  const [form, setForm] = useState<ProfileForm>(initialForm);
  const [status, setStatus] = useState("No changes");

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<User[]>("/users")
  });

  useEffect(() => {
    if (!userId && (usersQuery.data ?? []).length > 0) {
      setUserId(usersQuery.data![0].id);
    }
  }, [userId, usersQuery.data]);

  const userQuery = useQuery({
    queryKey: ["user", userId],
    queryFn: () => api.get<User>(`/users/${userId}`),
    enabled: Boolean(userId)
  });

  useEffect(() => {
    const user = userQuery.data;
    if (!user) {
      return;
    }
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
  }, [userQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const hobbies = form.hobbies
        .split(",")
        .map((hobby) => hobby.trim())
        .filter(Boolean)
        .slice(0, 3);

      return api.patch(`/users/${userId}/profile`, {
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
    onSuccess: () => {
      setStatus("Profile saved");
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      void queryClient.invalidateQueries({ queryKey: ["user", userId] });
    },
    onError: (error) => {
      setStatus(`Save failed: ${error.message}`);
    }
  });

  return (
    <RequireAuth>
      <div className="space-y-4">
      <section className="rounded-md border border-line bg-panel p-4">
        <h1 className="text-lg font-semibold">User Profile / Config File</h1>
        <div className="mt-3 grid gap-3 md:grid-cols-[260px_1fr]">
          <div>
            <label className="text-xs text-muted">User</label>
            <select
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-panelAlt px-3 py-2 text-sm"
            >
              {(usersQuery.data ?? []).map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
            <div className="mt-2 text-xs text-muted">{status}</div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
            <Input
              label="Occupation"
              value={form.occupation}
              onChange={(v) => setForm((f) => ({ ...f, occupation: v }))}
            />
            <Input label="Age" value={form.age} onChange={(v) => setForm((f) => ({ ...f, age: v }))} />
            <Input
              label="Hobbies (comma-separated, max 3)"
              value={form.hobbies}
              onChange={(v) => setForm((f) => ({ ...f, hobbies: v }))}
            />
            <Input
              label="IDE / Editor Choice"
              value={form.editorChoice}
              onChange={(v) => setForm((f) => ({ ...f, editorChoice: v }))}
            />
            <Input
              label="Programming Language"
              value={form.languageChoice}
              onChange={(v) => setForm((f) => ({ ...f, languageChoice: v }))}
            />
            <Input
              label="GitHub Username"
              value={form.githubUsername}
              onChange={(v) => setForm((f) => ({ ...f, githubUsername: v }))}
            />
            <Input
              label="Vibe Badge"
              value={form.vibeBadge}
              onChange={(v) => setForm((f) => ({ ...f, vibeBadge: v }))}
            />
            <Input
              label="Favorite Framework"
              value={form.favoriteFramework}
              onChange={(v) => setForm((f) => ({ ...f, favoriteFramework: v }))}
            />
            <Input
              label="Favorite OS"
              value={form.favoriteOS}
              onChange={(v) => setForm((f) => ({ ...f, favoriteOS: v }))}
            />
            <Input
              label="Favorite Data Structure"
              value={form.favoriteDataStructure}
              onChange={(v) => setForm((f) => ({ ...f, favoriteDataStructure: v }))}
            />
            <Input
              label="Favorite Algorithm"
              value={form.favoriteAlgorithm}
              onChange={(v) => setForm((f) => ({ ...f, favoriteAlgorithm: v }))}
            />
            <div>
              <label className="text-xs text-muted">Challenge Level</label>
              <select
                value={form.challengeLevel}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    challengeLevel: event.target.value as "EASY" | "MEDIUM" | "HARD"
                  }))
                }
                className="mt-1 w-full rounded-md border border-line bg-panelAlt px-3 py-2 text-sm"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={!userId || saveMutation.isPending}
          className="mt-4 rounded-md border border-accent/60 bg-accent/10 px-4 py-2 text-sm text-accent disabled:opacity-50"
        >
          Save Profile
        </button>
      </section>
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
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-muted">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-md border border-line bg-panelAlt px-3 py-2 text-sm"
      />
    </div>
  );
}
