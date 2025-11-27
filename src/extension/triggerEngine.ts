import triggerMap from "../data/build/trigger-map.json";
import { TypojiSettings } from "./types";

type TriggerEntry = {
  emoji: string;
  custom: boolean;
  priority: number;
  intensity: "low" | "medium" | "high";
  tags: string[];
  sourceNode: string;
  baseToken?: string;
};

type TriggerRegistry = Record<string, TriggerEntry>;

const registry = triggerMap as TriggerRegistry;

export type ReplacementCandidate = {
  token: string;
  emoji: string;
  baseToken?: string;
  tags: string[];
};

export function findReplacement(
  token: string,
  settings: TypojiSettings
): ReplacementCandidate | null {
  const normalized = normalizeToken(token);
  if (!normalized || !settings.enabled) {
    return null;
  }
  if (settings.disabledTokens.includes(normalized)) {
    return null;
  }
  const entry = registry[normalized];
  if (!entry) {
    return null;
  }
  if (
    settings.enabledTags.length > 0 &&
    !entry.tags.some((tag) => settings.enabledTags.includes(tag))
  ) {
    return null;
  }
  return {
    token: normalized,
    emoji: entry.emoji,
    baseToken: entry.baseToken,
    tags: entry.tags
  };
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

