"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { uploadProfileImageFile } from "@/lib/profile-image-upload";
import { ProfileGender, User } from "@/lib/types";
import { ImagePlus, Pencil, Save } from "lucide-react";

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
  gender: ProfileGender;
  locationText: string;
  latitude: string;
  longitude: string;
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
  gender: "MALE",
  locationText: "",
  latitude: "",
  longitude: "",
  challengeLevel: "EASY"
};

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { currentUserId } = useAuth();
  const [form, setForm] = useState<ProfileForm>(initialForm);
  const [status, setStatus] = useState("");
  const [imageStatus, setImageStatus] = useState("");
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
      gender: user.profile?.gender ?? "MALE",
      locationText: user.profile?.locationText ?? "",
      latitude: typeof user.profile?.latitude === "number" ? String(user.profile.latitude) : "",
      longitude: typeof user.profile?.longitude === "number" ? String(user.profile.longitude) : "",
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
        gender: form.gender,
        locationText: nullable(form.locationText),
        latitude: parseNullableNumber(form.latitude),
        longitude: parseNullableNumber(form.longitude),
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

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => uploadProfileImageFile(file),
    onSuccess: async () => {
      setImageStatus("Profile picture updated.");
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      await queryClient.invalidateQueries({ queryKey: ["user", currentUserId] });
    },
    onError: (error) => {
      setImageStatus(error instanceof Error ? error.message : "Upload failed");
    }
  });

  const profileImage = user?.profile?.profileImage || "/images/admin.png";
  const details = useMemo(
    () => [
      ["Occupation", user?.profile?.occupation || "Not set"],
      ["Language", user?.profile?.languageChoice || "Not set"],
      ["Framework", user?.profile?.favoriteFramework || "Not set"],
      ["OS", user?.profile?.favoriteOS || "Not set"],
      ["Data Structure", user?.profile?.favoriteDataStructure || "Not set"],
      ["Algorithm", user?.profile?.favoriteAlgorithm || "Not set"],
      ["Gender", user?.profile?.gender || "Not set"],
      ["Location", user?.profile?.locationText || "Not set"],
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
            <div className="group relative h-[72vh] min-h-[620px] overflow-hidden rounded-[2.2rem] border border-line bg-panel shadow-2xl">
              <img src={profileImage} alt={user?.name ?? "Profile"} className="h-full w-full object-cover" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100" />
              <div className="absolute inset-x-0 bottom-0 flex justify-center p-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                <label className="pointer-events-auto inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-black/45 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                  <ImagePlus className="h-4 w-4" />
                  Change Photo
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        setImageStatus("");
                        uploadMutation.mutate(file);
                      }
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
            {imageStatus ? <p className="mt-3 text-xs text-muted">{imageStatus}</p> : null}
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
                <p className="mt-0.5 text-sm text-muted">{user?.profile?.occupation || "Occupation not set"}</p>
                {status ? <p className="text-sm text-muted">{status}</p> : null}
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

            {editing ? (
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
                <div>
                  <label className="text-xs text-muted">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value as ProfileGender }))}
                    className="mt-1 w-full rounded-xl border border-line bg-panelAlt px-3 py-2 text-sm text-text"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
                <Input label="Location" value={form.locationText} onChange={(v) => setForm((f) => ({ ...f, locationText: v }))} />
                <Input label="Latitude" value={form.latitude} onChange={(v) => setForm((f) => ({ ...f, latitude: v }))} />
                <Input label="Longitude" value={form.longitude} onChange={(v) => setForm((f) => ({ ...f, longitude: v }))} />
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
            ) : null}

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
          </section>
        </div>
      </div>
    </RequireAuth>
  );
}

function nullable(value: string) {
  return value.trim() ? value.trim() : null;
}

function parseNullableNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
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
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-line bg-panelAlt px-3 py-2 text-sm text-text"
      />
    </div>
  );
}
