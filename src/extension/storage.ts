import { TypojiSettings, defaultSettings } from "./types";

const SETTINGS_KEY = "typojiSettings";

function hasChromeStorage(): boolean {
  return typeof chrome !== "undefined" && !!chrome.storage?.sync;
}

export async function getSettings(): Promise<TypojiSettings> {
  if (!hasChromeStorage()) {
    return defaultSettings;
  }
  const payload = await chrome.storage.sync.get(SETTINGS_KEY);
  const stored = payload[SETTINGS_KEY] as Partial<TypojiSettings> | undefined;
  return {
    ...defaultSettings,
    ...stored,
    enabledTags: stored?.enabledTags ?? defaultSettings.enabledTags,
    disabledTokens: stored?.disabledTokens ?? defaultSettings.disabledTokens
  };
}

export async function saveSettings(next: Partial<TypojiSettings>): Promise<void> {
  if (!hasChromeStorage()) {
    return;
  }
  const current = await getSettings();
  const merged = { ...current, ...next };
  await chrome.storage.sync.set({
    [SETTINGS_KEY]: merged
  });
}

export function watchSettings(callback: (settings: TypojiSettings) => void): () => void {
  if (!hasChromeStorage()) {
    return () => undefined;
  }
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string
  ) => {
    if (areaName !== "sync") return;
    const entry = changes[SETTINGS_KEY];
    if (!entry) return;
    const next = entry.newValue as TypojiSettings;
    callback({
      ...defaultSettings,
      ...next,
      enabledTags: next?.enabledTags ?? [],
      disabledTokens: next?.disabledTokens ?? []
    });
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

