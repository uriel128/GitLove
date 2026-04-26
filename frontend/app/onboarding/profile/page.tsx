"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/components/require-auth";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { isProfileComplete } from "@/lib/profile-complete";
import { uploadProfileImageFile } from "@/lib/profile-image-upload";
import { User } from "@/lib/types";
import { ImagePlus } from "lucide-react";

type FormState = {
  name: string;
  occupation: string;
  age: string;
  hobbyOne: string;
  hobbyTwo: string;
  hobbyThree: string;
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

const EMPTY_FORM: FormState = {
  name: "",
  occupation: "",
  age: "",
  hobbyOne: "",
  hobbyTwo: "",
  hobbyThree: "",
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

export default function ProfileOnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUserId } = useAuth();
  const [status, setStatus] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [imageStatus, setImageStatus] = useState("");

  const userQuery = useQuery({
    queryKey: ["user", currentUserId],
    queryFn: () => api.get<User>(`/users/${currentUserId}`),
    enabled: Boolean(currentUserId)
  });

  useEffect(() => {
    const user = userQuery.data;
    if (!user) {
      return;
    }

    if (isProfileComplete(user)) {
      router.replace("/home");
      return;
    }

    setForm({
      name: user.name ?? "",
      occupation: user.profile?.occupation ?? "",
      age: user.profile?.age?.toString() ?? "",
      hobbyOne: user.profile?.hobbies?.[0] ?? "",
      hobbyTwo: user.profile?.hobbies?.[1] ?? "",
      hobbyThree: user.profile?.hobbies?.[2] ?? "",
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
  }, [router, userQuery.data]);

  const isValid = useMemo(() => {
    const hobbies = [form.hobbyOne, form.hobbyTwo, form.hobbyThree].map((value) => value.trim());
    return (
      form.name.trim() &&
      form.occupation.trim() &&
      form.age.trim() &&
      Number.isInteger(Number(form.age)) &&
      Number(form.age) >= 18 &&
      Number(form.age) <= 99 &&
      hobbies.every(Boolean) &&
      form.editorChoice.trim() &&
      form.languageChoice.trim() &&
      form.githubUsername.trim() &&
      form.vibeBadge.trim() &&
      form.favoriteFramework.trim() &&
      form.favoriteOS.trim() &&
      form.favoriteDataStructure.trim() &&
      form.favoriteAlgorithm.trim()
    );
  }, [form]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId) {
        throw new Error("No active user");
      }
      const hobbies = [form.hobbyOne, form.hobbyTwo, form.hobbyThree].map((value) => value.trim());
      return api.patch(`/users/${currentUserId}/profile`, {
        name: form.name.trim(),
        occupation: form.occupation.trim(),
        age: Number(form.age),
        hobbies,
        editorChoice: form.editorChoice.trim(),
        languageChoice: form.languageChoice.trim(),
        githubUsername: form.githubUsername.trim(),
        vibeBadge: form.vibeBadge.trim(),
        favoriteFramework: form.favoriteFramework.trim(),
        favoriteOS: form.favoriteOS.trim(),
        favoriteDataStructure: form.favoriteDataStructure.trim(),
        favoriteAlgorithm: form.favoriteAlgorithm.trim(),
        challengeLevel: form.challengeLevel
      });
    },
    onSuccess: async () => {
      setStatus("Profile saved.");
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      await queryClient.invalidateQueries({ queryKey: ["user", currentUserId] });
      router.push("/home");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Failed to save profile";
      setStatus(message);
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => uploadProfileImageFile(file),
    onSuccess: async () => {
      setImageStatus("Profile picture uploaded.");
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      await queryClient.invalidateQueries({ queryKey: ["user", currentUserId] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Upload failed";
      setImageStatus(message);
    }
  });

  return (
    <RequireAuth>
      <div className="mx-auto max-w-3xl p-4 md:p-6">
        <section className="rounded-3xl border border-line bg-panel p-5 md:p-7">
          <h1 className="text-2xl font-bold text-text">Complete Your Profile</h1>
          <p className="mt-1 text-sm text-muted">
            Fill all required attributes to unlock Home and matching.
          </p>

          <div className="mt-4 rounded-2xl border border-line bg-panelAlt p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-text">Profile Picture</p>
                <p className="text-xs text-muted">PNG, JPG, WEBP up to 5MB</p>
                {imageStatus ? <p className="mt-1 text-xs text-muted">{imageStatus}</p> : null}
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-panel px-4 py-2 text-sm text-text hover:bg-panelAlt">
                <ImagePlus className="h-4 w-4" />
                Upload
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

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <Input label="Name" value={form.name} onChange={(value) => setForm((s) => ({ ...s, name: value }))} />
            <Input
              label="Occupation"
              value={form.occupation}
              onChange={(value) => setForm((s) => ({ ...s, occupation: value }))}
            />
            <Input label="Age" type="number" value={form.age} onChange={(value) => setForm((s) => ({ ...s, age: value }))} />
            <Select
              label="Challenge Level"
              value={form.challengeLevel}
              onChange={(value) => setForm((s) => ({ ...s, challengeLevel: value as FormState["challengeLevel"] }))}
              options={["EASY", "MEDIUM", "HARD"]}
            />
            <Input label="Hobby 1" value={form.hobbyOne} onChange={(value) => setForm((s) => ({ ...s, hobbyOne: value }))} />
            <Input label="Hobby 2" value={form.hobbyTwo} onChange={(value) => setForm((s) => ({ ...s, hobbyTwo: value }))} />
            <Input label="Hobby 3" value={form.hobbyThree} onChange={(value) => setForm((s) => ({ ...s, hobbyThree: value }))} />
            <Input
              label="IDE / Editor Choice"
              value={form.editorChoice}
              onChange={(value) => setForm((s) => ({ ...s, editorChoice: value }))}
            />
            <Input
              label="Programming Language"
              value={form.languageChoice}
              onChange={(value) => setForm((s) => ({ ...s, languageChoice: value }))}
            />
            <Input
              label="GitHub Username"
              value={form.githubUsername}
              onChange={(value) => setForm((s) => ({ ...s, githubUsername: value }))}
            />
            <Input
              label="Vibe Badge"
              value={form.vibeBadge}
              onChange={(value) => setForm((s) => ({ ...s, vibeBadge: value }))}
            />
            <Input
              label="Favorite Framework"
              value={form.favoriteFramework}
              onChange={(value) => setForm((s) => ({ ...s, favoriteFramework: value }))}
            />
            <Input
              label="Favorite OS"
              value={form.favoriteOS}
              onChange={(value) => setForm((s) => ({ ...s, favoriteOS: value }))}
            />
            <Input
              label="Favorite Data Structure"
              value={form.favoriteDataStructure}
              onChange={(value) => setForm((s) => ({ ...s, favoriteDataStructure: value }))}
            />
            <Input
              label="Favorite Algorithm"
              value={form.favoriteAlgorithm}
              onChange={(value) => setForm((s) => ({ ...s, favoriteAlgorithm: value }))}
            />
          </div>

          {status ? (
            <div className="mt-4 rounded-lg border border-line bg-panelAlt px-3 py-2 text-sm text-text">
              {status}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={!isValid || saveMutation.isPending || !currentUserId}
            className="mt-5 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saveMutation.isPending ? "Saving..." : "Save Profile and Continue"}
          </button>
        </section>
      </div>
    </RequireAuth>
  );
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
  type?: "text" | "number";
}) {
  return (
    <div>
      <label className="text-xs text-muted">{label}</label>
      <input
        value={value}
        type={type}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-line bg-panelAlt px-3 py-2 text-sm text-text outline-none focus:border-accent"
      />
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-muted">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-line bg-panelAlt px-3 py-2 text-sm text-text outline-none focus:border-accent"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
