#!/usr/bin/env bun
/**
 * Generates a trimmed GloVe vocabulary JSON for variable name classification.
 *
 * Category anchor words are imported directly from classifyInputLabel.ts —
 * no duplication required.
 *
 * Usage (via package.json scripts):
 *   bun run gen-vocab                  # build-time check / interactive download
 *   bun run gen-vocab -- file.txt      # use an already-extracted GloVe .txt file
 *   bun run gen-vocab -- file.txt out  # custom output path
 *
 * Adjust TOP_N to tune the output size (~400 chars/entry in compact JSON):
 *   TOP_N = 30 000  →  ~12 MB
 *   TOP_N = 50 000  →  ~20 MB   ← default
 */

import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "fs";
import { dirname, join } from "path";
import { createInterface } from "readline";
import { Unzip, UnzipInflate } from "fflate";
import { CATEGORY_ANCHORS } from "../../src/utils/classifyInputLabel";

const GLOVE_URL = "https://nlp.stanford.edu/data/glove.6B.zip";
const GLOVE_FILENAME = "glove.6B.50d.txt";
const TOP_N = 50_000;
const OUTPUT_DEFAULT = join(
  import.meta.dir,
  "../../src/assets/embeddings/vocab.json"
);

// Derived from the classifier's own definitions — single source of truth
const ANCHOR_WORDS = new Set(Object.values(CATEGORY_ANCHORS).flat());

// ── Helpers ───────────────────────────────────────────────────────────────────

function vocabIsPopulated(path: string): boolean {
  try {
    const c = readFileSync(path, "utf-8").trim();
    return c !== "" && c !== "{}" && c !== "{ }";
  } catch {
    return false;
  }
}

function printProgress(downloaded: number, total: number): void {
  if (total > 0) {
    const pct = Math.min((downloaded / total) * 100, 100);
    const bar = "#".repeat(Math.floor(pct / 2)).padEnd(50, " ");
    process.stdout.write(`\r  [${bar}] ${pct.toFixed(1)}%`);
  } else {
    process.stdout.write(
      `\r  Downloaded ${(downloaded / 1024 / 1024).toFixed(1)} MB...`
    );
  }
}

function parseLine(
  vocab: Record<string, number[]>,
  line: string,
  lineCount: number
): void {
  const spaceIdx = line.indexOf(" ");
  if (spaceIdx === -1) return;
  const word = line.slice(0, spaceIdx);
  if (lineCount <= TOP_N || ANCHOR_WORDS.has(word)) {
    vocab[word] = line
      .slice(spaceIdx + 1)
      .split(" ")
      .map(Number);
  }
}

function writeVocab(
  vocab: Record<string, number[]>,
  lineCount: number,
  outputPath: string
): void {
  const missing = [...ANCHOR_WORDS].filter((w) => !(w in vocab));
  console.log(
    `Scanned ${lineCount.toLocaleString()} entries, kept ${Object.keys(
      vocab
    ).length.toLocaleString()} words.`
  );
  if (missing.length > 0) {
    console.warn(
      `WARNING: ${missing.length} anchor words not found in GloVe: ${missing
        .sort()
        .join(", ")}`
    );
  }
  mkdirSync(dirname(outputPath), { recursive: true });
  const json = JSON.stringify(vocab);
  writeFileSync(outputPath, json);
  console.log(
    `Wrote ${outputPath} (~${(json.length / 1024 / 1024).toFixed(1)} MB)`
  );
}

// ── Generation paths ──────────────────────────────────────────────────────────

async function generateFromFile(
  gloveFile: string,
  outputPath: string
): Promise<void> {
  console.log(`Reading ${gloveFile} ...`);
  console.log(
    `Keeping top ${TOP_N.toLocaleString()} words + ${
      ANCHOR_WORDS.size
    } anchor words ...`
  );

  const vocab: Record<string, number[]> = {};
  let lineCount = 0;

  const rl = createInterface({
    input: createReadStream(gloveFile),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    lineCount++;
    parseLine(vocab, line, lineCount);
  }

  writeVocab(vocab, lineCount, outputPath);
}

async function downloadAndGenerate(outputPath: string): Promise<void> {
  console.log(`Downloading ${GLOVE_URL} ...`);
  console.log("  (822 MB — this will take a few minutes)\n");

  const response = await fetch(GLOVE_URL);
  if (!response.ok)
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  if (!response.body) throw new Error("Response has no body");

  const total = parseInt(response.headers.get("content-length") ?? "0");
  let downloaded = 0;

  const vocab: Record<string, number[]> = {};
  let lineCount = 0;
  let lineBuffer = "";
  const decoder = new TextDecoder();

  await new Promise<void>((resolve, reject) => {
    const unzipper = new Unzip();
    unzipper.register(UnzipInflate);
    let fileFound = false;

    unzipper.onfile = (file) => {
      if (file.name !== GLOVE_FILENAME) {
        file.terminate();
        return;
      }
      fileFound = true;
      file.ondata = (err, data, final) => {
        if (err) {
          reject(err);
          return;
        }
        lineBuffer += decoder.decode(data, { stream: !final });
        const parts = lineBuffer.split("\n");
        lineBuffer = final ? "" : parts.pop() ?? "";
        for (const line of parts) {
          lineCount++;
          parseLine(vocab, line, lineCount);
        }
        if (final) resolve();
      };
      file.start();
    };

    (async () => {
      const reader = response.body!.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            unzipper.push(new Uint8Array(0), true);
            if (!fileFound)
              reject(new Error(`${GLOVE_FILENAME} not found in zip`));
            break;
          }
          downloaded += value.length;
          printProgress(downloaded, total);
          unzipper.push(value);
        }
      } catch (err) {
        reject(err);
      }
    })();
  });

  process.stdout.write("\n");
  writeVocab(vocab, lineCount, outputPath);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const outputPath = args[1] ?? OUTPUT_DEFAULT;

  // Path provided: use it directly
  if (args[0]) {
    if (!existsSync(args[0])) {
      console.error(`Error: GloVe file not found: ${args[0]}`);
      process.exit(1);
    }
    await generateFromFile(args[0], outputPath);
    return;
  }

  // No path — check if vocab already exists
  if (vocabIsPopulated(outputPath)) {
    console.log("gen-vocab: vocab.json already populated, skipping.");
    return;
  }

  // Non-interactive (CI / build): warn and exit cleanly
  if (!process.stdin.isTTY) {
    console.warn(
      "gen-vocab: WARNING — The vocabulary file used for automatic branching logic is empty.\n" +
        "  Variable name classification will fall back to 'path' for all inputs.\n" +
        "  To generate real embeddings, run interactively:\n" +
        "    bun run gen-vocab"
    );
    return;
  }

  // Interactive: offer to download
  console.log(
    "The vocabulary file used for automatic branching logic is empty."
  );
  console.log(
    "To populate it, you'll need to download the GloVe 50d word vector set."
  );
  const answer = prompt("Download now (~822 MB)? [y/N] ") ?? "";
  if (answer.trim().toLowerCase() !== "y") {
    console.log("Skipped. Run 'bun run gen-vocab' again when ready.");
    return;
  }

  await downloadAndGenerate(outputPath);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
