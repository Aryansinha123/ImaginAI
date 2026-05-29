/** Human labels for common LLM / JSON keys */
const FIELD_LABELS = {
  event: "Event",
  outcome: "Outcome",
  impact: "Impact",
  status: "Status",
  importance: "Importance",
  summary: "Summary",
  description: "Description",
  thread: "Thread",
  text: "Details",
  title: "Title",
  detail: "Detail",
  characters: "Characters",
  character: "Character",
  emotion: "Emotion",
  tension: "Tension",
  resolution: "Resolution",
  change: "Change",
  arc: "Arc",
  relationship: "Relationship",
  note: "Note",
  stakes: "Stakes",
};

const PRIORITY_KEYS = [
  "event",
  "title",
  "summary",
  "thread",
  "description",
  "text",
  "outcome",
  "impact",
  "status",
  "emotion",
  "tension",
  "change",
  "arc",
  "stakes",
  "resolution",
  "importance",
  "characters",
  "character",
  "detail",
  "note",
  "relationship",
];

function formatLabel(key) {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^\w/, (c) => c.toUpperCase());
}

function tryParseJsonString(str) {
  const trimmed = str.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

/** Unwrap strings, arrays, and nested objects into a plain object or primitive */
function unwrapValue(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      const parsed = tryParseJsonString(trimmed);
      if (parsed !== null) return unwrapValue(parsed);
    }
    return trimmed;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    const parts = value.map((item) => formatStoryBibleText(item)).filter(Boolean);
    return parts.length ? parts.join(" · ") : null;
  }
  if (typeof value === "object") return value;
  return String(value);
}

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/**
 * Structured lines for rich UI (label + value rows).
 * Returns null if a single plain sentence is enough.
 */
export function getStoryBibleLines(value) {
  const unwrapped = unwrapValue(value);
  if (!isPlainObject(unwrapped)) return null;

  const skip = new Set(["id", "type", "index"]);
  const entries = Object.entries(unwrapped).filter(
    ([k, v]) => !skip.has(k) && v !== null && v !== undefined && v !== ""
  );

  if (entries.length === 0) return null;
  if (entries.length === 1 && typeof entries[0][1] !== "object") return null;

  const lines = [];
  const used = new Set();

  for (const key of PRIORITY_KEYS) {
    if (unwrapped[key] !== undefined && unwrapped[key] !== null && unwrapped[key] !== "") {
      const val = unwrapped[key];
      if (typeof val === "object" && !Array.isArray(val)) {
        const nested = getStoryBibleLines(val);
        if (nested) {
          nested.forEach((line) => lines.push(line));
        } else {
          lines.push({ label: formatLabel(key), value: formatStoryBibleText(val) });
        }
      } else {
        lines.push({
          label: formatLabel(key),
          value: Array.isArray(val)
            ? val.map((x) => formatStoryBibleText(x)).join(", ")
            : formatStoryBibleText(val),
        });
      }
      used.add(key);
    }
  }

  for (const [key, val] of entries) {
    if (used.has(key)) continue;
    if (typeof val === "object" && val !== null && !Array.isArray(val)) {
      const nested = getStoryBibleLines(val);
      if (nested) nested.forEach((line) => lines.push(line));
      else lines.push({ label: formatLabel(key), value: formatStoryBibleText(val) });
    } else {
      lines.push({
        label: formatLabel(key),
        value: formatStoryBibleText(val),
      });
    }
  }

  const filtered = lines.filter((l) => l.value);
  return filtered.length > 1 ? filtered : filtered.length === 1 ? [filtered[0]] : null;
}

/** Single-line readable text — never raw JSON with braces */
export function formatStoryBibleText(value, fallback = "") {
  const unwrapped = unwrapValue(value);

  if (unwrapped === null) return fallback;
  if (typeof unwrapped === "string") {
    const s = unwrapped.trim();
    if (s.startsWith("{") || s.startsWith("[")) {
      const again = tryParseJsonString(s);
      if (again) return formatStoryBibleText(again, fallback);
    }
    return s || fallback;
  }
  if (typeof unwrapped === "number" || typeof unwrapped === "boolean") {
    return String(unwrapped);
  }
  if (isPlainObject(unwrapped)) {
    const lines = getStoryBibleLines(unwrapped);
    if (lines && lines.length > 0) {
      return lines.map((l) => `${l.label}: ${l.value}`).join(" · ");
    }

    const parts = [];
    for (const key of PRIORITY_KEYS) {
      if (unwrapped[key] != null && unwrapped[key] !== "") {
        const part = formatStoryBibleText(unwrapped[key]);
        if (part) parts.push(part);
      }
    }
    if (parts.length) return parts.join(" — ");

    const values = Object.values(unwrapped)
      .map((v) => formatStoryBibleText(v))
      .filter(Boolean);
    if (values.length) return values.join(" — ");
  }

  return fallback;
}

export function normalizeStoryBibleForDisplay(bible) {
  if (!bible || typeof bible !== "object") {
    return {
      important_events: [],
      active_story_threads: [],
      character_summaries: {},
      relationship_summaries: {},
      world_summary: "",
    };
  }

  const keepEntry = (item) => {
    const text = formatStoryBibleText(item);
    return text && !looksLikeRawJson(text);
  };

  return {
    important_events: (bible.important_events || []).filter(keepEntry),
    active_story_threads: (bible.active_story_threads || []).filter(keepEntry),
    character_summaries: Object.fromEntries(
      Object.entries(bible.character_summaries || {}).filter(([, v]) => keepEntry(v))
    ),
    relationship_summaries: Object.fromEntries(
      Object.entries(bible.relationship_summaries || {}).filter(([, v]) => keepEntry(v))
    ),
    world_summary: bible.world_summary,
  };
}

function looksLikeRawJson(text) {
  if (typeof text !== "string") return false;
  const t = text.trim();
  return (
    (t.startsWith("{") && t.endsWith("}")) ||
    (t.startsWith("[") && t.endsWith("]"))
  );
}
