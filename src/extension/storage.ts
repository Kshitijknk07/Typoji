import { defaultSettings } from "./types";
import type { TypojiSettings } from "./types";

const SETTINGS_KEY = "typojiSettings";

type ChromeLike = typeof globalThis & { chrome?: unknown };

type ChromeProbe = {
  storage?: {
    sync?: chrome.storage.SyncStorageArea;
    onChanged?: chrome.storage.StorageChange;
  };
};

function isChromeNamespace(value: unknown): value is typeof chrome {
  if (!value || typeof value !== "object") {
    return false;
  }
  const probe = value as ChromeProbe;
  const storage = probe.storage;
  if (!storage) {
    return false;
  }
  return Boolean(storage.sync && storage.onChanged);
}

function resolveChrome(): typeof chrome | null {
  const candidate = (globalThis as ChromeLike).chrome;
  if (!isChromeNamespace(candidate)) {
    return null;
  }
  return candidate;
}

export async function getSettings(): Promise<TypojiSettings> {
  const chromeApi = resolveChrome();
  if (!chromeApi) {
    return { ...defaultSettings };
  }
  const payload = await chromeApi.storage.sync.get(SETTINGS_KEY);
  const stored = payload[SETTINGS_KEY] as Partial<TypojiSettings> | undefined;
  return {
    ...defaultSettings,
    ...stored,
    enabledTags: stored?.enabledTags ?? defaultSettings.enabledTags,
    disabledTokens: stored?.disabledTokens ?? defaultSettings.disabledTokens,
  };
}

export async function saveSettings(next: Partial<TypojiSettings>): Promise<void> {
  const chromeApi = resolveChrome();
  if (!chromeApi) {
    return;
  }
  const current = await getSettings();
  const merged = { ...current, ...next };
  await chromeApi.storage.sync.set({
    [SETTINGS_KEY]: merged,
  });
}

export function watchSettings(callback: (settings: TypojiSettings) => void): () => void {
  const chromeApi = resolveChrome();
  if (!chromeApi) {
    return () => undefined;
  }
  const listener = (
    changes: Partial<Record<string, chrome.storage.StorageChange>>,
    areaName: string,
  ) => {
    if (areaName !== "sync") return;
    const entry = changes[SETTINGS_KEY];
    if (!entry) return;
    const next = entry.newValue as Partial<TypojiSettings> | undefined;
    const normalized: TypojiSettings = {
      ...defaultSettings,
      ...next,
      enabledTags: next?.enabledTags ?? defaultSettings.enabledTags,
      disabledTokens: next?.disabledTokens ?? defaultSettings.disabledTokens,
    };
    callback(normalized);
  };
  chromeApi.storage.onChanged.addListener(listener);
  return () => chromeApi.storage.onChanged.removeListener(listener);
}
