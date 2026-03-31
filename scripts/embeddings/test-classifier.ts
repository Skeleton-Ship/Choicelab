/**
 * Tests the variable name classifier against labelled examples.
 *
 * Imports classifyWithVocab directly from the source so there is no duplicated
 * logic — changes to the classifier are reflected here automatically.
 *
 * Usage:
 *   bun scripts/embeddings/test-classifier.ts
 *   bun scripts/embeddings/test-classifier.ts --verbose
 */

import { readFileSync } from "fs";
import { join } from "path";
import {
  classifyWithVocab,
  type VocabMap,
  type Classification,
} from "../../src/utils/classifyInputLabel";

// ── Load vocab ────────────────────────────────────────────────────────────────

const VOCAB_PATH = join(
  import.meta.dir,
  "../../src/assets/embeddings/vocab.json"
);

function loadVocab(): VocabMap {
  let raw: Record<string, number[]>;
  try {
    raw = JSON.parse(readFileSync(VOCAB_PATH, "utf-8"));
  } catch {
    console.error(`Error: could not read ${VOCAB_PATH}`);
    console.error("Run 'bun run gen-vocab' first.");
    process.exit(1);
  }
  if (Object.keys(raw).length === 0) {
    console.error(
      "Error: vocab.json is the empty placeholder — run 'bun run gen-vocab' first."
    );
    process.exit(1);
  }
  const map: VocabMap = new Map();
  for (const [word, vec] of Object.entries(raw)) {
    map.set(word, new Float32Array(vec));
  }
  return map;
}

// ── Test cases ────────────────────────────────────────────────────────────────
// Format: [labels, expectedCategory, description]

const TEST_CASES: [string[], string, string][] = [
  // From public/branch test/branch test.clx
  [
    ["Someplace outside", "Someplace inside"],
    "place",
    "inside/outside place choice",
  ],
  [["A hotel room", "A living room"], "place", "room type choice"],
  [["The beach", "The balcony"], "place", "outdoor location choice"],
  [["Chicago", "LA", "Pennsylvania"], "place", "city/state names"],
  [["Chicago", "Along Route 66"], "place", "city + road description"],
  [["Day", "Night"], "time", "time of day"],
  [
    ["By train", "By car", "On foot", "By tram", "By plane"],
    "action",
    "modes of transport",
  ],
  // Single inputField-style labels
  [["Enter your name"], "name", "name field (pre-pass)"],
  [["What is your favorite city?"], "place", "city field (pre-pass)"],
  [["How are you feeling?"], "emotion", "feeling field"],
  [["What time is it when you get there?"], "time", "time field"],
  [["How will you get there?"], "action", "transport method field"],
  // Harder cases — labels that don't directly name their category
  [["Happy", "Sad", "Angry", "Nervous"], "emotion", "emotion adjectives"],
  [["Elated", "Melancholic", "Anxious"], "emotion", "uncommon emotion words"],
  [["Option 1", "Option 2", "Option 3"], "choice", "ternary choice"],
  [["Agree", "Disagree", "Neutral"], "choice", "agreement scale"],
  [["The sword", "The shield", "The map"], "item", "item choice"],
  [["Paris", "Rome", "Tokyo"], "place", "city names (OOV risk)"],
  [["Enter your character's name"], "name", "character name field"],
  [["Describe how you're feeling"], "emotion", "feeling description field"],
];

// ── Runner ────────────────────────────────────────────────────────────────────

function run(verbose: boolean): void {
  const vocab = loadVocab();
  console.log(`Loaded ${vocab.size.toLocaleString()} words\n`);

  let passed = 0,
    failed = 0,
    fellBack = 0;

  for (const [labels, expected, description] of TEST_CASES) {
    if (verbose) {
      console.log(`  [${description}]`);
      console.log(`    labels: ${JSON.stringify(labels)}`);
    }

    const result: Classification = classifyWithVocab(labels, vocab);
    const { name: predicted, confidence } = result;

    const ok = predicted === expected;
    const isFallback = predicted === "path" && expected !== "path";
    const status = ok ? "PASS" : isFallback ? "FALL" : "FAIL";
    const marker = ok ? "✓" : isFallback ? "·" : "✗";

    const confStr = confidence > 0 ? confidence.toFixed(2) : "—   ";
    const labelPreview =
      labels
        .slice(0, 3)
        .map((l) => `"${l}"`)
        .join(", ") + (labels.length > 3 ? `, … (+${labels.length - 3})` : "");

    console.log(
      `  ${marker} [${status}]  conf=${confStr}  got=${predicted.padEnd(
        10
      )}  want=${expected.padEnd(10)}  ${labelPreview}`
    );
    if (verbose) console.log();

    if (ok) passed++;
    else if (isFallback) fellBack++;
    else failed++;
  }

  console.log(
    `\n  ${passed}/${TEST_CASES.length} passed  |  ${fellBack} fell back to 'path'  |  ${failed} wrong category`
  );

  if (fellBack > 0) {
    console.log("\n  Fallbacks mean the vocab had too few matching tokens —");
    console.log(
      "  consider expanding ANCHOR_WORDS in trim-glove.py and regenerating."
    );
  }
  if (failed > 0) {
    console.log("\n  Wrong-category results suggest centroid overlap —");
    console.log(
      "  try adding more discriminative anchors to CATEGORY_ANCHORS."
    );
  }
}

const verbose =
  process.argv.includes("--verbose") || process.argv.includes("-v");
run(verbose);
