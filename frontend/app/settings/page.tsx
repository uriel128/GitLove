"use client";

import { ReactNode, useEffect, useState } from "react";
import { Bell, LockKeyhole, Save, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";

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
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState("No changes saved");

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

  return (
    <RequireAuth>
      <div className="space-y-6">
        <section className="rounded-xl border border-line bg-gradient-to-r from-panel via-panelAlt/70 to-panel px-5 py-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-accent" />
            <h1 className="text-lg font-semibold text-text">Settings</h1>
          </div>
          <p className="mt-1 text-sm text-muted">{status}</p>
        </section>

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
      </div>
    </RequireAuth>
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
