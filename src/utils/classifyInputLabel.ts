/*
 * Classifies a set of input labels (button labels or an inputField label) into
 * a semantic category name suitable for use as a variable name.
 *
 * Pipeline:
 *   1. Regex pre-pass  — extract the core noun from common prompt scaffolding
 *   2. Tokenize        — lowercase, strip punctuation, remove stop words
 *   3. Embed           — look up each token in the trimmed GloVe vocab
 *   4. Compare         — cosine similarity against pre-computed category centroids
 *   5. Threshold       — return "path" if best similarity is below MIN_CONFIDENCE
 *
 * The vocab JSON (src/assets/embeddings/vocab.json) is loaded once and cached
 * as a dynamic import — Vite splits it into a content-hashed chunk so it is
 * lazy-loaded and cache-busted automatically when regenerated.
 * Run scripts/embeddings/trim-glove.py to regenerate it from GloVe 50d.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface Classification {
  /** camelCase variable name, e.g. "place", "characterName", "emotion" */
  name: string;
  /** 0–1 cosine similarity against the winning category centroid */
  confidence: number;
}

export type VocabMap = Map<string, Float32Array>;

// ── Category definitions ─────────────────────────────────────────────────────
// Each category is defined by anchor words whose vectors will be averaged to
// form a centroid. The key becomes the returned variable name.

export const CATEGORY_ANCHORS: Record<string, string[]> = {
  place: [
    "city",
    "town",
    "country",
    "location",
    "destination",
    "region",
    "place",
    "area",
    "village",
    "land",
    "territory",
    "address",
    "neighborhood",
    "world",
    "map",
    "home",
  ],
  name: [
    "name",
    "character",
    "person",
    "identity",
    "username",
    "title",
    "alias",
    "player",
    "hero",
    "protagonist",
    "role",
    "avatar",
  ],
  choice: [
    "yes",
    "no",
    "agree",
    "disagree",
    "confirm",
    "cancel",
    "accept",
    "decline",
    "approve",
    "reject",
    "option",
    "decision",
    "prefer",
    "decide",
    "want",
    "favor",
  ],
  emotion: [
    "happy",
    "sad",
    "angry",
    "excited",
    "nervous",
    "afraid",
    "joy",
    "sorrow",
    "fear",
    "love",
    "hate",
    "anxious",
    "mood",
    "feeling",
    "emotion",
    "content",
    "thrilled",
  ],
  number: [
    "amount",
    "count",
    "score",
    "quantity",
    "total",
    "number",
    "measure",
    "value",
    "sum",
    "points",
    "level",
    "rank",
    "rating",
  ],
  topic: [
    "topic",
    "subject",
    "theme",
    "category",
    "genre",
    "type",
    "kind",
    "sort",
    "issue",
    "matter",
    "field",
    "domain",
  ],
  time: [
    "date",
    "time",
    "day",
    "month",
    "year",
    "hour",
    "moment",
    "period",
    "duration",
    "schedule",
    "deadline",
    "era",
    "age",
    "when",
  ],
  action: [
    "action",
    "move",
    "attempt",
    "activity",
    "task",
    "step",
    "perform",
    "approach",
    "strategy",
    "plan",
    "method",
    "mission",
    "objective",
    "goal",
    "travel",
    "drive",
    "walk",
    "fly",
    "ride",
    "transport",
    "vehicle",
    "journey",
    "go",
  ],
  dialogue: [
    "say",
    "reply",
    "response",
    "speak",
    "talk",
    "message",
    "words",
    "quote",
    "tell",
    "statement",
    "phrase",
    "line",
    "speech",
    "comment",
    "conversation",
  ],
  item: [
    "item",
    "object",
    "thing",
    "possession",
    "tool",
    "weapon",
    "food",
    "equipment",
    "gear",
    "artifact",
    "resource",
    "treasure",
    "inventory",
  ],
};

// Similarity must exceed this value to use the category label; otherwise "path"
export const MIN_CONFIDENCE = 0.38;

// ── Stop words (filtered before embedding) ───────────────────────────────────

export const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "shall",
  "should",
  "may",
  "might",
  "must",
  "can",
  "could",
  "need",
  "dare",
  "your",
  "my",
  "our",
  "their",
  "its",
  "his",
  "her",
  "this",
  "that",
  "these",
  "those",
  "i",
  "you",
  "he",
  "she",
  "we",
  "they",
  "it",
  "me",
  "him",
  "us",
  "them",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "up",
  "about",
  "into",
  "through",
  "during",
  "before",
  "after",
  "above",
  "below",
  "between",
  "out",
  "off",
  "over",
  "under",
  "again",
  "then",
  "once",
  "and",
  "but",
  "or",
  "nor",
  "so",
  "yet",
  "both",
  "either",
  "not",
  "what",
  "own",
  "same",
  "than",
  "too",
  "very",
  "just",
  "now",
  "here",
  "there",
  "where",
  "why",
  "how",
  "all",
  "each",
  "every",
  "some",
  "any",
  "few",
  "more",
  "most",
  "other",
  "only",
  "also",
  "well",
  "even",
]);

// ── Regex pre-pass ────────────────────────────────────────────────────────────
// Extracts the core noun phrase from common prompt scaffolding, e.g.:
//   "Enter your character's name"  →  "name"
//   "What is your favorite city?"  →  "city"
//   "Choose a destination"         →  "destination"
// Returns null if no pattern matches (falls through to full embedding).

const PRE_PASS_PATTERNS: RegExp[] = [
  // "Enter your X" / "Enter X" / "Enter a/an X"
  /^(?:enter|type|input|write|fill in|provide|give)\s+(?:your\s+|a\s+|an\s+)?(?:\w+\s+)?(\w+)\s*[?.!]?$/i,
  // "What is your X?" / "What's your X?"
  /^what(?:'s|\s+is)\s+your\s+(?:\w+\s+)?(\w+)\s*[?.!]?$/i,
  // "What X do/did/would/will you ...?"
  /^(what|how)\s+(\w+)\s+(?:do|did|would|which|will|should|can|have)\s+you/i,
  // "Choose/Pick/Select a/an/your X"
  /^(?:choose|pick|select|decide on|pick)\s+(?:a\s+|an\s+|your\s+)?(?:\w+\s+)?(\w+)\s*[?.!]?$/i,
  // "Describe your X" / "Tell us your X"
  /^(?:describe|tell\s+(us|me)|share)\s+(?:your\s+|a\s+|an\s+)?(?:\w+\s+)?(\w+)\s*[?.!]?$/i,
];

function extractCoreTerm(label: string): string | null {
  // "How will/do/would/can you [verb]?" — structural action question.
  // The verb (e.g. "get") is too generic to embed reliably; the structure
  // itself is the signal. Return the category key so it short-circuits to
  // { name: "action", confidence: 1.0 } without going through embedding.
  if (/^how\s+(?:will|do|would|can|should|did|might|could)\s+you\b/i.test(label)) {
    return "action";
  }

  for (const pattern of PRE_PASS_PATTERNS) {
    const match = label.match(pattern);
    if (match) {
      const term = match[1].toLowerCase().replace(/[^a-z]/g, "");
      if (term && !STOP_WORDS.has(term)) return term;
    }
  }
  return null;
}

// ── Math helpers ──────────────────────────────────────────────────────────────

function addVectors(a: Float32Array, b: Float32Array): Float32Array {
  const result = new Float32Array(a.length);
  for (let i = 0; i < a.length; i++) result[i] = a[i] + b[i];
  return result;
}

function scaleVector(v: Float32Array, s: number): Float32Array {
  const result = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) result[i] = v[i] * s;
  return result;
}

function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

function averageVectors(words: string[], vocab: VocabMap): Float32Array | null {
  let sum: Float32Array | null = null;
  let count = 0;
  for (const word of words) {
    const vec = vocab.get(word);
    if (!vec) continue;
    sum = sum ? addVectors(sum, vec) : new Float32Array(vec);
    count++;
  }
  if (!sum || count === 0) return null;
  return scaleVector(sum, 1 / count);
}

function buildCentroids(vocab: VocabMap): Map<string, Float32Array> {
  const map = new Map<string, Float32Array>();
  for (const [category, anchors] of Object.entries(CATEGORY_ANCHORS)) {
    const centroid = averageVectors(anchors, vocab);
    if (centroid) map.set(category, centroid);
  }
  return map;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

function toCamelCase(s: string): string {
  return s
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .map((word, i) =>
      i === 0
        ? word.toLowerCase()
        : word[0].toUpperCase() + word.slice(1).toLowerCase()
    )
    .join("");
}

function bestMatch(
  inputVec: Float32Array,
  centroids: Map<string, Float32Array>
): Classification {
  let bestCategory = "path";
  let bestScore = -Infinity;
  for (const [category, centroid] of centroids.entries()) {
    const score = cosineSimilarity(inputVec, centroid);
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }
  return {
    name: toCamelCase(bestCategory),
    confidence: Math.max(0, bestScore),
  };
}

// ── Core classification (pure — no I/O) ───────────────────────────────────────

/**
 * Classify a set of input labels given an already-loaded vocab map.
 * Exported for use in tests and other contexts where the vocab is
 * provided directly rather than loaded via the Vite dynamic import.
 */
export function classifyWithVocab(
  labels: string[],
  vocab: VocabMap
): Classification {
  const centroids = buildCentroids(vocab);

  // Stage 1: regex pre-pass (single inputField labels only)
  if (labels.length === 1) {
    const core = extractCoreTerm(labels[0]);
    if (core) {
      if (CATEGORY_ANCHORS[core])
        return { name: toCamelCase(core), confidence: 1.0 };
      const vec = averageVectors([core], vocab);
      if (vec) {
        const result = bestMatch(vec, centroids);
        if (result.confidence >= MIN_CONFIDENCE) return result;
      }
    }
  }

  // Stage 2: embed the full label set
  const allTokens = labels.flatMap(tokenize);
  if (allTokens.length === 0) return { name: "path", confidence: 0 };

  const inputVec = averageVectors(allTokens, vocab);
  if (!inputVec) return { name: "path", confidence: 0 };

  const result = bestMatch(inputVec, centroids);
  return result.confidence >= MIN_CONFIDENCE
    ? result
    : { name: "path", confidence: 0 };
}

// ── Async public API ──────────────────────────────────────────────────────────

let vocabPromise: Promise<VocabMap> | null = null;

async function loadVocab(): Promise<VocabMap> {
  if (vocabPromise) return vocabPromise;
  vocabPromise = import("../assets/embeddings/vocab.json")
    .then((mod) => {
      const data = mod.default as Record<string, number[]>;
      const map = new Map<string, Float32Array>();
      for (const [word, vec] of Object.entries(data)) {
        map.set(word, new Float32Array(vec));
      }
      return map;
    })
    .catch((err) => {
      vocabPromise = null;
      throw err;
    });
  return vocabPromise;
}

/**
 * Classify a set of input labels into a variable name category.
 *
 * @param labels - For button groups, pass all button label strings.
 *                 For an inputField, pass a single-element array with the field label.
 * @returns { name, confidence } — name is a camelCase variable name suggestion.
 *          Falls back to "path" with confidence 0 if the vocab fails to load
 *          or no category clears the similarity threshold.
 */
export async function classifyInputLabel(
  labels: string[]
): Promise<Classification> {
  let vocab: VocabMap;
  try {
    vocab = await loadVocab();
  } catch {
    return { name: "path", confidence: 0 };
  }
  return classifyWithVocab(labels, vocab);
}

/**
 * Warm up the vocab by triggering the fetch early (e.g., call on app load).
 * Subsequent calls to classifyInputLabel will use the cached result.
 */
export function warmUpClassifier(): void {
  loadVocab().catch(() => {});
}
