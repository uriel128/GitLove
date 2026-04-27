"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { Bell, LockKeyhole, Save, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/api";
import { hasAdminRoleFromAuthUser } from "@/lib/authz";

type SettingsState = {
  notifications: boolean;
  showOnlineStatus: boolean;
  challengeLevelLock: boolean;
  markdownPreview: boolean;
};

const STORAGE_KEY = "gitlove_settings_v1";

const DEFAULT_SETTINGS: SettingsState = {
  notifications: true,
  showOnlineStatus: true,
  challengeLevelLock: false,
  markdownPreview: true
};

export default function SettingsPage() {
  const { currentUser, currentUserId, getAccessToken, changePassword } = useAuth();
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState("No changes saved");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("No password update requested");

  const authMeQuery = useQuery({
    queryKey: ["auth-me", currentUserId],
    queryFn: async () => {
      const accessToken = await getAccessToken();
      return apiRequest<{ authUser: { app_metadata?: { role?: unknown; roles?: unknown } | null } }>(
        "/auth/me",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );
    },
    enabled: Boolean(currentUserId)
  });

  const isAdmin = useMemo(
    () => hasAdminRoleFromAuthUser(authMeQuery.data?.authUser ?? null),
    [authMeQuery.data]
  );

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as SettingsState;
      setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      setStatus("Settings loaded");
    } catch {
      setStatus("Using default settings");
    }
  }, []);

  function updateSetting<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setStatus("Unsaved changes");
  }

  function saveSettings() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setStatus("Settings saved");
  }

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

  return (
    <RequireAuth>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-accent" />
          <h1 className="text-lg font-semibold text-text">Settings</h1>
        </div>
        <p className="text-sm text-muted">{status}</p>

        <section className="grid gap-4 md:grid-cols-2">
          <SettingRow
            icon={<Bell className="h-4 w-4 text-accent" />}
            title="Notifications"
            value={settings.notifications}
            onChange={(value) => updateSetting("notifications", value)}
          />
          <SettingRow
            icon={<ShieldCheck className="h-4 w-4 text-accent" />}
            title="Show Online Status"
            value={settings.showOnlineStatus}
            onChange={(value) => updateSetting("showOnlineStatus", value)}
          />
          <SettingRow
            icon={<LockKeyhole className="h-4 w-4 text-accent" />}
            title="Lock Challenge Level"
            value={settings.challengeLevelLock}
            onChange={(value) => updateSetting("challengeLevelLock", value)}
          />
          <SettingRow
            icon={<ShieldCheck className="h-4 w-4 text-accent" />}
            title="Markdown Preview in Chat"
            value={settings.markdownPreview}
            onChange={(value) => updateSetting("markdownPreview", value)}
          />
        </section>

        <section className="rounded-xl border border-line bg-gradient-to-r from-panel to-panelAlt px-5 py-4">
          <button
            type="button"
            onClick={saveSettings}
            className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white"
          >
            <Save className="h-4 w-4" />
            Save Settings
          </button>
        </section>

        <section className="rounded-xl border border-line bg-gradient-to-r from-panel to-panelAlt px-5 py-4">
          <h2 className="text-sm font-semibold text-text">Change Password</h2>
          <p className="mt-1 text-xs text-muted">{passwordStatus}</p>
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
          <button
            type="button"
            onClick={() => passwordMutation.mutate()}
            disabled={passwordMutation.isPending}
            className="mt-4 inline-flex items-center gap-2 rounded-md border border-line bg-panel px-4 py-2 text-sm text-text disabled:opacity-50"
          >
            {passwordMutation.isPending ? "Updating..." : "Update Password"}
          </button>
        </section>

        {isAdmin ? (
          <section className="rounded-xl border border-line bg-panel px-5 py-4">
            <h2 className="text-sm font-semibold text-text">Admin Account Controls</h2>
            <p className="mt-1 text-sm text-muted">
              Review created accounts and assign temporary passwords from the admin panel.
            </p>
            <Link
              href="/admin"
              className="mt-4 inline-flex items-center rounded-md border border-accent/60 bg-accent/10 px-4 py-2 text-sm font-medium text-accent"
            >
              Open Admin Panel
            </Link>
          </section>
        ) : null}
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
  type?: "text" | "password";
}) {
  return (
    <div>
      <label className="text-xs text-muted">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
      />
    </div>
  );
}

function SettingRow({
  icon,
  title,
  value,
  onChange
}: {
  icon: ReactNode;
  title: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-line bg-gradient-to-r from-panel to-panelAlt px-4 py-4">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium text-text">{title}</span>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          value ? "bg-accent" : "bg-panelAlt"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
            value ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
