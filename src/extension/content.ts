import { getSettings, watchSettings } from "./storage";
import { defaultSettings } from "./types";
import type { TypojiSettings } from "./types";
import { findReplacement } from "./triggerEngine";
import { SuggestionHost } from "./ui";

type TextEditable = HTMLInputElement | HTMLTextAreaElement;

const suggestionHost = new SuggestionHost();
let settings: TypojiSettings = defaultSettings;

void init();

async function init() {
  settings = await getSettings();
  watchSettings((next) => {
    settings = next;
  });
  document.addEventListener("input", handleInput, true);
}

function handleInput(event: Event) {
  if (!settings.enabled) return;
  const target = event.target;
  if (!isTextEditable(target)) return;
  const candidate = extractCandidate(target);
  if (!candidate) return;
  const replacement = findReplacement(candidate.word, settings);
  if (!replacement) return;
  if (settings.mode === "auto") {
    applyReplacement(target, candidate.start, candidate.end, replacement.emoji);
    return;
  }
  suggestionHost.show(
    target,
    { word: candidate.word, emoji: replacement.emoji },
    {
      onAccept: () =>
        applyReplacement(target, candidate.start, candidate.end, replacement.emoji),
      onDismiss: () => undefined,
    },
  );
}

function isTextEditable(element: unknown): element is TextEditable {
  if (!element) return false;
  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
    return false;
  }
  if (element instanceof HTMLInputElement) {
    return (
      element.type === "text" ||
      element.type === "search" ||
      element.type === "email" ||
      element.type === "url" ||
      element.type === "tel"
    );
  }
  return true;
}

const WORD_PATTERN = /[\p{L}\p{N}'’_-]/u;

function isWordChar(char: string): boolean {
  if (!char) return false;
  return WORD_PATTERN.test(char);
}

function isBoundaryChar(char: string): boolean {
  if (!char) return true;
  return !isWordChar(char);
}

type Candidate = {
  word: string;
  start: number;
  end: number;
};

function extractCandidate(target: TextEditable): Candidate | null {
  const cursor = target.selectionStart;
  if (cursor === null || cursor <= 0) {
    return null;
  }
  const text = target.value;
  if (isWordChar(text[cursor - 1] ?? "")) {
    return null;
  }
  let end = cursor - 1;
  while (end >= 0 && isBoundaryChar(text[end])) {
    end -= 1;
  }
  if (end < 0) {
    return null;
  }
  let start = end;
  while (start >= 0 && isWordChar(text[start])) {
    start -= 1;
  }
  const word = text.slice(start + 1, end + 1);
  if (!word) {
    return null;
  }
  return {
    word,
    start: start + 1,
    end: end + 1,
  };
}

function applyReplacement(
  target: TextEditable,
  start: number,
  end: number,
  emoji: string,
) {
  const value = target.value;
  const nextValue = value.slice(0, start) + emoji + value.slice(end);
  target.value = nextValue;
  const cursor = start + emoji.length;
  target.setSelectionRange(cursor, cursor);
  const event =
    typeof InputEvent !== "undefined"
      ? new InputEvent("input", {
          bubbles: true,
          cancelable: true,
          inputType: "insertReplacementText",
          data: emoji,
        })
      : new Event("input", { bubbles: true, cancelable: true });
  target.dispatchEvent(event);
}
