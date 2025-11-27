export type ReplacementMode = "auto" | "confirm";

export interface TypojiSettings {
  enabled: boolean;
  mode: ReplacementMode;
  enabledTags: string[];
  disabledTokens: string[];
}

export const defaultSettings: TypojiSettings = {
  enabled: true,
  mode: "auto",
  enabledTags: [],
  disabledTokens: [],
};
