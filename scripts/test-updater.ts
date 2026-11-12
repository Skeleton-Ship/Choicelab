/*
 * Runs the app in dev mode against a fake update server, to test the update
 * check, the toolbar's "Update Ready" button, and Check for Updates... without
 * publishing a release.
 *
 *   bun run dev:update-available
 *   bun run dev:update-unsupported
 *   bun run dev:update-up-to-date
 *   bun run dev:update-offline
 *
 * To switch scenarios, quit and rerun with another one.
 *
 * Download URLs don't exist, so clicking "Update Ready" or "Install and Relaunch"
 * tests the failure path without installing anything. Don't point this at real
 * artifacts: installing over a dev build isn't supported.
 */

const PORT = 1430;

const SCENARIOS = {
  available: "An update is available and this machine can run it",
  unsupported: "An update is available, but this machine's OS is too old",
  "up-to-date": "No newer version",
  offline: "The update server returns an error",
} as const;
type Scenario = keyof typeof SCENARIOS;

function isScenario(value: string): value is Scenario {
  return value in SCENARIOS;
}

function manifest(scenario: Scenario) {
  const platform = { url: "https://example.invalid/update", signature: "x" };
  const targets = [
    "darwin-aarch64",
    "darwin-x86_64",
    "windows-x86_64",
    "windows-aarch64",
  ];
  return {
    version: scenario === "up-to-date" ? "0.0.1" : "99.0.0",
    notes: "Test update",
    pub_date: new Date().toISOString(),
    platforms: Object.fromEntries(targets.map((t) => [t, platform])),
    minimumSystemVersion:
      scenario === "unsupported"
        ? { macos: "99.0", windows: "99.0" }
        : { macos: "10.0", windows: "10.0" },
  };
}

function printScenarios(current?: Scenario) {
  console.log("\n[updater] Scenarios (run with bun run dev:update-<scenario>):");
  for (const [name, description] of Object.entries(SCENARIOS)) {
    const marker = name === current ? "→" : " ";
    console.log(`[updater]  ${marker} ${name.padEnd(11)} ${description}`);
  }
  console.log("");
}

const arg = process.argv[2] ?? "";
if (!isScenario(arg)) {
  console.error(arg ? `Unknown scenario "${arg}".` : "No scenario given.");
  printScenarios();
  process.exit(1);
}
const scenario: Scenario = arg;

Bun.serve({
  port: PORT,
  hostname: "127.0.0.1",
  fetch(req) {
    if (new URL(req.url).pathname !== "/latest.json") {
      return new Response("Not found", { status: 404 });
    }
    console.log(`[updater] Served "${scenario}"`);
    if (scenario === "offline") {
      return new Response("Unavailable", { status: 503 });
    }
    return Response.json(manifest(scenario));
  },
});

printScenarios(scenario);

// Only the endpoint is overridden; the rest of the updater config (including
// the public key) is kept. Dev builds allow http endpoints; release builds don't.
const config = {
  plugins: {
    updater: { endpoints: [`http://127.0.0.1:${PORT}/latest.json`] },
  },
};

const app = Bun.spawn(
  ["bun", "run", "tauri", "dev", "--config", JSON.stringify(config)],
  { stdio: ["inherit", "inherit", "inherit"] }
);
process.exit(await app.exited);
