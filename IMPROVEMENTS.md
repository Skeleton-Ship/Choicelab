# Future technical improvements

Choicelab's codebase is well-organized and functional, but accumulated technical debt makes further feature development harder. This improvements list is not focused on user-facing features, but improving reliability/performance, patterns, and the developer experience.

**Stack**: Tauri 2, Preact, TypeScript (strict), Vite, SCSS, Rust/Actix backend
**State**: Window globals (`window.__CHOICELAB_DATA__`, `window.__CHOICELAB_VIEW__`) with manual `update()` callbacks threaded through props
**Tests**: None for the frontend (no framework configured); a few Rust unit tests (`cargo test`)
**Linting**: ESLint covers `.js`, `.ts`, and `.tsx` files, with ~80 existing problems
**Formatting**: `.prettierrc` exists, but there's no `format` script and it isn't run
**~180 TS/TSX files** (including the player), ~17,100 lines of code

---

## 1. Reliability & performance

### 1b. Replace Polling with Proper Async Coordination (Medium Impact, Medium Effort)

**Problem**: `src/fs/loadProjectData.ts` retries up to 600 times in a loop, with `await delay()` sprinkled in, to wait for data to appear on `window.__CHOICELAB_DATA_RAW__`. This is a timing workaround, not a real solution.
**Fix**: Use a `Promise` that resolves when the data is available — either via a `window` custom event dispatched when data is set, or by restructuring the data-passing flow between windows using Tauri's `once()` listener pattern. This would be more deterministic, faster, and eliminate the loop entirely.
**File**: `src/fs/loadProjectData.ts`

### 1c. Add Project File Validation on Load (Medium Impact, Low Effort)

**Problem**: Loaded `.clx` project JSON is parsed and used directly with no schema validation. A malformed or outdated file can cause runtime errors deep in the app.
**Fix**: Add a lightweight validation step after parsing (checking required top-level keys, version compatibility). A `validateProject()` function that throws a user-friendly error before the project is mounted. No external schema library needed.
**Files**: `src/fs/loadProjectData.ts`, new `src/data/validateProject.ts`

### 1d. Add Error Boundaries Around Subsystems (Low Impact, Low Effort)

**Problem**: Each window has one error boundary at its root (`src/errors/ErrorBoundary.tsx`), so a crash anywhere replaces the whole window with the crash screen. A crash in, say, the inspector takes the flowchart down with it.
**Fix**: Add smaller boundaries around the flowchart and the inspector, each showing a compact "this panel couldn't be displayed" state with a retry, while the rest of the window keeps working. The root boundary stays as the backstop.
**Files**: `src/editor/MainEditor.tsx`, `src/errors/ErrorBoundary.tsx`

### 1e. Fix Recursive Node Position Calculation (Low Impact, Low Effort)

**Problem**: `positionNodes.ts` resolves x-coordinate conflicts by recursively calling itself with `x + 1` until no collision is found. With a large flowchart this could eventually stack overflow.
**Fix**: Convert to an iterative `while` loop.
**File**: `src/editor/flowchart/linking/positionNodes.ts`

### 1f. Log Errors to a File (Medium Impact, Low Effort)

**Problem**: Errors only go to the webview console and Rust's stderr, neither of which a user can see or send. When someone reports an issue, there's no record of what went wrong beyond what the crash screen's "Copy Error Details" captured. Rust panics aren't recorded anywhere.
**Fix**: Add `tauri-plugin-log` to write frontend and backend errors to a file in the app's log folder, and install a Rust panic hook (`std::panic::set_hook`) that writes there too. Add a **Help → Show Log** menu item, or attach the recent log to "Copy Error Details".
**Files**: `src-tauri/Cargo.toml`, `src-tauri/src/main.rs`, `src/errors/globalErrorHandlers.ts`, `src/errors/CrashScreen.tsx`

### 1g. Detect Unresponsive Windows (Medium Impact, Medium Effort)

**Problem**: If JavaScript gets stuck (e.g. an infinite loop), the window stops responding, but the OS doesn't notice: the app's native main thread is still fine, so there's no spinning cursor or "not responding" prompt. The crash screen can't help, since it needs JavaScript to run.
**Fix**: Have each window send Rust a heartbeat every few seconds. If heartbeats stop, show a native dialog ("The window isn't responding") with **Wait** and **Reload**. Reloading already offers to restore the autosave. Electron's `unresponsive` event works this way; Tauri has no equivalent.
**Files**: New `src-tauri/src/watchdog.rs`, `src/main.tsx`

### 1h. Recover When the Webview Process Ends (Low Impact, Medium Effort)

**Problem**: The webview's content process can be ended by the OS (memory pressure, large media) or crash on its own, leaving a blank window with no explanation.
**Fix**: Listen for the platform's notification — `webViewWebContentProcessDidTerminate` on macOS (via `NativeBridge.m`), WebView2's `ProcessFailed` on Windows — and reload the window, which offers to restore the autosave.
**Files**: `src-tauri/src/NativeBridge.m`, `src-tauri/src/native_bridge_windows.rs`

### 1i. Recover From Errors Without the Crash Screen (Low Impact, Medium Effort)

**Problem**: When an event handler or async task throws, `globalErrorHandlers.ts` logs it, and only shows the crash screen if errors keep happening. In between, the view can be left inconsistent (e.g. a selection pointing at a deleted node), and an edit that threw partway through may have written a half-finished change to the store.
**Fix**: After an uncaught error, reset temporary view state (selection, open popovers, drags) and re-render from the store. For risky edits (structural flowchart changes, deleting variables), snapshot the store first and restore it if the edit throws. With 2b's dispatcher, this becomes one try/catch around `dispatch()`.
**Files**: `src/errors/globalErrorHandlers.ts`, `src/data/dataStore.ts`

### 1j. Retire the `save-text-file` and `create-directory` Events (Low Impact, Low Effort)

**Problem**: Project saves, exports, autosave, and undo history now go through commands that report failures (`src-tauri/src/project_files.rs`, `project_cache.rs`). The remaining writes — mostly preview files — still use these older events, which can't report errors, run on the main thread, and let the webview write to any path.
**Fix**: Move the remaining callers to commands that write only inside the project's cache folder (like `write_project_cache_file`), then remove both listeners from `bind_listeners.rs`.
**Files**: `src/preview/updatePreview.ts`, `src/preview/updatePreviewFonts.ts`, `src/fs/createWebDir.ts`, `src/fs/newProject.ts`, `src-tauri/src/bind_listeners.rs`

---

## 2. Standardized Patterns

### 2a. Migrate State to Preact Signals (High Impact, High Effort)

**Problem**: The window global pattern with manual `update()` callbacks threaded through every component prop is the biggest source of complexity. It requires every caller to manually trigger re-renders, makes components tightly coupled to global state, and makes cross-window communication fragile.
**Fix**: Preact has a first-party reactive primitive — `@preact/signals` — that is a natural fit. Signals are reactive values that automatically re-render components that read them, eliminating the `update()` callback pattern. Because signals are module-level (not React Context), they work naturally in Tauri's multi-window architecture. The migration can be incremental: start with `ViewStore` (UI-only state), then migrate `Store` (project data). The window global pattern for cross-window data passing can stay for inter-window IPC specifically.
**Depends on**: 2b, at least for project data. Signals only pay off when writes are granular; with today's whole-store replacement, every edit would still re-render everything. And `update()` also triggers history snapshots and preview refreshes, which need a home before it can be removed; 2b's dispatcher provides one. `ViewStore` doesn't have undo history, so it can move to signals independently.
**Files**: `src/data/dataStore.ts`, `src/editor/MainEditor.tsx`, all component files that receive `update: UpdateFunction` props. New `src/data/signals.ts`.

### 2b. Route Project Edits Through Commands (High Impact, High Effort) — in progress

**Problem**: Most edits work on the whole project at once. `getStore()` and `setStore()` deep-clone the entire store on each read and write, and ~30 files modify their copy directly before writing all of it back. Most history entries are a full snapshot of the project written to disk, and the settings window is sent the full store as JSON after every change.
**Fix**: Express each kind of edit as a named command (e.g. `addAction`, `setActionProp`, `linkNode`, `deleteNodes`), applied through a single `dispatch()` function. The dispatcher becomes the one place that applies the change, records history, marks the project unsaved, refreshes the preview, and notifies other windows. Commands can also carry their own behavior, like coalescing consecutive keystrokes into a single undo step, which replaces the `updateHistory` / `updatePreview` flags passed to `update()` today. Undo can store each command's inverse instead of a full snapshot; [Immer](https://immerjs.github.io/immer/)'s `produceWithPatches` generates both the change and its inverse as patches, which avoids hand-writing an inverse for every command. Migrate incrementally, one area of the project at a time.
**Order**: Do this before (or alongside) 2a; see the note there.
**Files**: `src/data/dataStore.ts`, `src/data/history.ts`, `src/editor/MainEditor.tsx`, every file that calls `setStore()`. New `src/data/commands/`.

#### Done so far

History is now a stack of entries (`ProjectHistory` in `src/typings.ts`; see the header of `src/data/history.ts`). Snapshots are one kind of entry, so commands and snapshots share the same stack while areas move over.

- **Phase 1: History entries.** Snapshots are wrapped as `snapshot` entries with `before` / `after` versions. All recording goes through `pushHistory()`. Undo steps are queued so they run one at a time.
- **Phase 2: Project settings as commands.** `setProjectSetting` entries record a key, `before` and `after`. The settings window sends change requests, not its store (`src/editor/settings/settingChanges.ts`). `group` entries undo several entries as one step. `pushHistory(entry, { merge: true })` merges a burst of changes from continuous controls (typing, spinners).
- **Phase 3: Undo in the settings window.** Each entry records its `source` window. The settings window only undoes its own entries, after giving text fields (including the Custom CSS editor's own history) the first chance (`src/editor/settings/settingsUndo.ts`). The project window undoes everything.

#### Next phases

Each area moves over completely, then snapshot restores stop touching it (see "Ownership" below). Roughly from easiest to hardest:

- **Phase 4: Assets.** An `addAsset` command. Nothing removes assets today, and unused assets are harmless, so snapshot restores can simply keep the current asset list. This also replaces the snapshot that background image changes currently put in a `group` with their setting (`applySettingChange()`).
- **Phase 5: Variables.** Commands for adding, changing (name, type, starting value), and deleting variables. Nodes refer to variables by ID, so renaming doesn't touch them. But two edits reach into nodes, which are still snapshot-owned until phase 6, so each records a `group` of variable commands plus a snapshot:
  - Deleting a variable also removes it from actions and rules.
  - Auto-generate (`triggerApply()` in `src/data/autoGenerate.ts`) creates variables and branch stems together.
- **Phase 6: Sequences and nodes.** The bulk of the work: about 27 files record edits through `update()`. Nodes refer to each other through links, so sequences can't be split up the way settings were. They have to move over as one area. Two ways to get there:
  - _Named commands through `dispatch()`_ (the original plan above), with Immer patches as the inverse. Clearest history, but every call site changes before the area can switch.
  - _A generated fallback first:_ when a snapshot would be recorded, diff the project against the previous state and store the changed parts as patches instead. Every call site works at once, and they can move to named commands later. The cost is a diff on every edit, which may be slow on large projects.
- **Phase 7: Retire snapshots.** Once nothing records them, remove:
  - the `snapshot` entry kind and the restore logic that keeps command-owned areas
  - the History cache files (`writeSnapshot()` / `loadSnapshot()`)
  - the `request-history-version` listener in `src-tauri/src/bind_listeners.rs`
  - the "history" background write failure (`src/fs/fileErrorText.ts`)

**Unlocked along the way:**

- Marking a project as unsaved again after you undo back to the point where you last saved. History entries now have stable IDs, so `currentHistoryId()` can be compared with the ID recorded at save (see the commented-out NOTE in `stepHistory()`). This doesn't depend on later phases.
- Sending other windows only what changed, rather than the whole store (`syncSettingsWindow()`).
- 2a and 1i, as noted there.

#### Lessons from phases 1–3

- **Ownership.** Each area of the project belongs to exactly one model: snapshots or commands. When restoring a snapshot, keep the current value of every command-owned area (`applyEntry()`). Otherwise, undoing an unrelated edit reverts it.
- **Changes that span areas** go in a `group` entry, so they undo as one step.
- **`getStore()` returns a deep copy.** Compare entries by ID, never by object identity.
- **Other windows send requests, never stores.** The project window owns history, and checks an entry's `source` when the step runs, not when it's requested, since queued steps move `location`.
- **Events reach more windows than you'd expect.** Menu events are labeled with the focused window but reach all of them, and a global `listen()` also receives `emitTo()` events meant for other windows. Filter by window label or project ID. (`request-history-version` in `bind_listeners.rs` uses a broadcast `emit`; `emit_to` would be more precise.)
- **Merging is opt-in**, only for continuous controls; discrete changes stay separate steps. A merged entry gets a new ID, so save's change check still works.
- **Uncontrolled editors** (like the Prism-based Custom CSS editor) have to follow the store themselves. Ignore incoming values while the editor is focused: they're echoes of typing, and can lag behind it.

#### Known issues

Found in review, not yet fixed:

- **A missing snapshot holds up undo for 10 seconds.** When the backend can't read a snapshot, `request-history-version` in `bind_listeners.rs` only logs the error and sends nothing back. `loadSnapshot()` waits for its timeout, and every queued undo waits behind it. Fix: send an error response so the step fails right away. (Phase 7 removes snapshots entirely.)
- **The Custom CSS editor can skip an undo result it asked for.** When Cmd+Z in the editor continues into project history, `expectExternalValue()` lets the next incoming value through even though the editor is focused. A lagging echo of earlier typing can use that up first, and the real result is then skipped as an echo. Rare: the editor's own history has to be empty while echoes are still arriving. Fix: record the value being waited for (or the history entry ID), and only let that one through. Files: `src/editor/settings/activeCodeEditor.ts`, `AppearanceCustomCSS.tsx`.
- **`decodeCSS()` changes valid CSS escapes.** It turns every literal `\n` into a newline, to read older projects that stored newlines escaped. It used to run only when the editor opened; now it runs on every sync, so CSS like `content: "\n";` is changed the next time the editor isn't focused. Fix: decode once in a migration step (`src/fs/migrateProject.ts`, with a schema version bump) and remove `decodeCSS()`.

### 2c. Add a Code Formatter (High Impact, Low Effort)

**Problem**: A `.prettierrc` exists, but nothing runs it. Code style consistency depends entirely on individual IDE settings.
**Fix**: Add Prettier as a dev dependency (or switch to Biome as a combined lint+format tool), add a `format` script to `package.json`, and format the codebase once.
**Files**: Updated `package.json`

### 2e. Consolidate `getData.ts` Query Patterns (Low Impact, Low Effort)

**Problem**: `src/data/getData.ts` (269 lines) has many repetitive lookup functions that all follow the same `array.find()` pattern.
**Fix**: Extract a generic `findById<T>()` utility and use it throughout. Reduces the file by ~30% and makes the pattern explicit.
**File**: `src/data/getData.ts`

---

## 3. Developer Experience

### 3a. Add Vitest for Unit Testing (High Impact, Medium Effort)

**Problem**: Zero test coverage. The data layer (`getData.ts`, `createNode.ts`, `history.ts`, `deleteData.ts`) and utility functions are pure functions that are trivially testable and represent the highest-value coverage.
**Fix**: Add Vitest (shares Vite config, zero extra setup needed). Start by testing the data layer and utility functions. Other good early candidates: the file error text mapper (`src/fs/fileErrorText.ts`) and the autosave timing in `src/fs/autosave.ts`.

```bash
bun add -D vitest
```

**Files**: New `src/**/*.test.ts` files; updated `package.json` with `"test": "vitest"` script.

### 3b. Add Pre-commit Hooks (Medium Impact, Low Effort)

**Problem**: Lint and format checks only run manually. Bad code can be committed without any gate.
**Fix**: Add `husky` + `lint-staged` to run ESLint + Prettier on staged files before each commit.

```bash
bun add -D husky lint-staged
```

**Files**: New `.husky/pre-commit`, updated `package.json`

### 3c. Add `.editorconfig` (Low Impact, Low Effort)

**Problem**: No shared editor configuration. Tab/space and line-ending settings differ by developer IDE config.
**Fix**: Add a `.editorconfig` at the root. Respected by virtually all editors without plugins.
**File**: New `.editorconfig`

### 3d. Break Up `fonts.ts` (Low Impact, Low Effort)

**Problem**: `src/fonts/fonts.ts` is 1,412 lines of hardcoded font metadata — a single monolithic export.
**Fix**: Split into per-font-family files and re-export from an index. No behavior change.
**Files**: `src/fonts/fonts.ts` → `src/fonts/<family>.ts` + `src/fonts/index.ts`

---

## Priority Order

| #   | Suggestion                                       | Effort | Impact                     |
| --- | ------------------------------------------------ | ------ | -------------------------- |
| 1   | Add Prettier                                     | Low    | Medium DX                  |
| 2   | Add `.editorconfig`                              | Low    | Low DX                     |
| 3   | Add Vitest + data layer tests                    | Medium | High long-term reliability |
| 4   | Log errors to a file                             | Low    | Medium reliability         |
| 5   | Project file validation on load                  | Low    | Medium reliability         |
| 6   | Detect unresponsive windows                      | Medium | Medium reliability         |
| 7   | Replace polling in loadProjectData               | Medium | Medium reliability         |
| 8   | Add pre-commit hooks                             | Low    | Medium DX                  |
| 9   | Retire `save-text-file` / `create-directory`     | Low    | Low reliability            |
| 10  | Add error boundaries around subsystems           | Low    | Low reliability            |
| 11  | Recover when the webview process ends            | Medium | Low reliability            |
| 12  | Fix recursive position calculation               | Low    | Low reliability            |
| 13  | Route project edits through commands             | High   | High (long-term)           |
| 14  | Recover from errors without the crash screen     | Medium | Low reliability            |
| 15  | Migrate state to Preact Signals                  | High   | High (long-term)           |
| 16  | Consolidate getData patterns                     | Low    | Low DX                     |
| 17  | Break up `fonts.ts`                              | Low    | Low DX                     |

Items 1–12 can all be done independently and incrementally. Items 13 (commands) and 15 (Signals migration) are the highest-leverage long-term changes but the most involved — best tackled after the others are in place, with 13 first, since 15 depends on it for project data. Item 14 is much simpler once 13 is done.
