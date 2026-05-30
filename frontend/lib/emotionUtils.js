export const EMOTION_KEYS = [
  "trust",
  "attachment",
  "awkwardness",
  "resentment",
  "comfort",
];

export function coerceEmotionNumber(val, fallback = 50) {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "boolean") return fallback;
  if (typeof val === "number" && !Number.isNaN(val)) {
    return Math.max(0, Math.min(100, Math.round(val)));
  }
  if (typeof val === "string") {
    const parsed = parseFloat(val.replace("%", "").trim());
    if (!Number.isNaN(parsed)) {
      return Math.max(0, Math.min(100, Math.round(parsed)));
    }
    return fallback;
  }
  if (typeof val === "object") {
    if (val.new !== undefined) return coerceEmotionNumber(val.new, fallback);
    if (val.value !== undefined) return coerceEmotionNumber(val.value, fallback);
    if (val.level !== undefined) return coerceEmotionNumber(val.level, fallback);
  }
  return fallback;
}

export function normalizeEmotionMap(raw) {
  const base = {
    trust: 50,
    attachment: 50,
    awkwardness: 0,
    resentment: 0,
    comfort: 50,
  };
  if (!raw || typeof raw !== "object") return { ...base };

  for (const [key, val] of Object.entries(raw)) {
    const lower = key.toLowerCase();
    if (EMOTION_KEYS.includes(lower)) {
      base[lower] = coerceEmotionNumber(val, base[lower]);
    }
  }
  return base;
}

function normalizePairKey(key) {
  return key.replace(/\s+/g, "").toLowerCase();
}

export function findUpdatedEmotionsForPair(fromName, toName, updatedEmotions) {
  if (!updatedEmotions || typeof updatedEmotions !== "object") return null;
  
  const fromNorm = fromName.replace(/\s+/g, "").toLowerCase();
  const toNorm = toName.replace(/\s+/g, "").toLowerCase();

  const fromFirst = fromName.split(/\s+/)[0].toLowerCase();
  const toFirst = toName.split(/\s+/)[0].toLowerCase();

  for (const [key, val] of Object.entries(updatedEmotions)) {
    const parts = key.split(/(?:->|➔| to | and |[-_])/i);
    if (parts.length === 2) {
      const kFromNorm = parts[0].replace(/\s+/g, "").toLowerCase();
      const kToNorm = parts[1].replace(/\s+/g, "").toLowerCase();
      
      // Check exact match first
      if (kFromNorm === fromNorm && kToNorm === toNorm) {
        return val;
      }
      
      // Fallback: Check if first names match or if one name contains the other
      const fromMatches = kFromNorm === fromFirst || fromNorm.includes(kFromNorm) || kFromNorm.includes(fromNorm);
      const toMatches = kToNorm === toFirst || toNorm.includes(kToNorm) || kToNorm.includes(toNorm);
      if (fromMatches && toMatches) {
        return val;
      }
    }
  }
  return null;
}

export function resolveCurrentEmotionsForPair(
  pairKey,
  ancestorEmotions,
  project,
  fromChar,
  toChar
) {
  let current =
    ancestorEmotions[pairKey] ||
    Object.entries(ancestorEmotions || {}).find(
      ([k]) => normalizePairKey(k) === normalizePairKey(pairKey)
    )?.[1];

  if (!current && project?.canvas_edges && fromChar && toChar) {
    const fromId = fromChar._id?.toString?.() || fromChar.id;
    const toId = toChar._id?.toString?.() || toChar.id;
    const edge = project.canvas_edges.find(
      (e) =>
        (e.source === fromId && e.target === toId) ||
        (e.source === toId && e.target === fromId)
    );

    if (edge?.emotions) {
      if (edge.source === fromId && edge.emotions.source_to_target) {
        current = edge.emotions.source_to_target;
      } else if (edge.target === fromId && edge.emotions.target_to_source) {
        current = edge.emotions.target_to_source;
      } else if (typeof edge.emotions.trust === "number") {
        current = edge.emotions;
      }
    }
  }

  return normalizeEmotionMap(current);
}

export function buildEmotionDeltasFromApi(
  updatedEmotions,
  assignedCharacters,
  ancestorEmotions,
  project
) {
  const emotionDeltas = {};
  if (!updatedEmotions || assignedCharacters.length < 2) return emotionDeltas;

  for (let i = 0; i < assignedCharacters.length; i++) {
    for (let j = 0; j < assignedCharacters.length; j++) {
      if (i === j) continue;

      const fromChar = assignedCharacters[i];
      const toChar = assignedCharacters[j];
      const pairKey = `${fromChar.name}->${toChar.name}`;
      const newEms = findUpdatedEmotionsForPair(
        fromChar.name,
        toChar.name,
        updatedEmotions
      );
      if (!newEms) continue;

      const currentEms = resolveCurrentEmotionsForPair(
        pairKey,
        ancestorEmotions,
        project,
        fromChar,
        toChar
      );
      const newMap = normalizeEmotionMap(newEms);

      const deltas = {};
      for (const k of EMOTION_KEYS) {
        const previous = currentEms[k];
        const next = newMap[k];
        deltas[k] = {
          previous,
          new: next,
          delta: next - previous,
        };
      }
      emotionDeltas[pairKey] = deltas;
    }
  }

  return emotionDeltas;
}

export function coerceDeltaNumber(val, fallback = 0) {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "number" && !Number.isNaN(val)) {
    return Math.round(val);
  }
  if (typeof val === "string") {
    const parsed = parseFloat(val.replace("%", "").trim());
    if (!Number.isNaN(parsed)) {
      return Math.round(parsed);
    }
  }
  return fallback;
}

/** Normalize stored emotion_deltas for display (handles legacy shapes). */
export function parseEmotionDisplayEntry(data) {
  if (typeof data === "number") {
    const delta = coerceDeltaNumber(data, 0);
    return { previous: null, newVal: null, delta };
  }
  if (!data || typeof data !== "object") {
    return { previous: null, newVal: null, delta: 0 };
  }

  const previous = coerceEmotionNumber(data.previous, null);
  const newVal = coerceEmotionNumber(
    data.new,
    previous !== null ? previous : 50
  );
  let delta =
    data.delta !== undefined && data.delta !== null
      ? coerceDeltaNumber(data.delta, 0)
      : previous !== null
        ? newVal - previous
        : 0;

  if (Number.isNaN(delta)) delta = 0;

  return {
    previous: previous !== null ? previous : null,
    newVal,
    delta,
  };
}

export function getAccumulatedEmotionsFromScenes(activeSceneId, scenes) {
  const emotions = {};
  const resolvedKeys = new Set();
  let currentId = activeSceneId;

  while (currentId) {
    const sceneObj = scenes.find((s) => s.id === currentId);
    if (!sceneObj) break;

    if (sceneObj.emotion_deltas) {
      for (const [key, deltas] of Object.entries(sceneObj.emotion_deltas)) {
        const normKey = key;
        const existingKey = Object.keys(emotions).find(
          (k) => normalizePairKey(k) === normalizePairKey(normKey)
        );
        if (existingKey) continue;

        const values = {};
        for (const [emName, emVal] of Object.entries(deltas)) {
          const lower = emName.toLowerCase();
          if (!EMOTION_KEYS.includes(lower)) continue;
          if (typeof emVal === "number") {
            values[lower] = coerceEmotionNumber(emVal);
          } else if (emVal && typeof emVal === "object") {
            values[lower] = coerceEmotionNumber(
              emVal.new !== undefined ? emVal.new : emVal,
              50
            );
          }
        }
        if (Object.keys(values).length > 0) {
          emotions[key] = normalizeEmotionMap(values);
          resolvedKeys.add(key);
        }
      }
    }
    currentId = sceneObj.parent_id;
  }
  return emotions;
}
