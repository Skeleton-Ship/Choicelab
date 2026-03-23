# Future technical improvements

Choicelab's codebase is well-organized and functional, but accumulated technical debt makes further feature development harder. This improvements list is not focused on user-facing features, but improving reliability/performance, patterns, and the developer experience.

**Stack**: Tauri 2, Preact, TypeScript (strict), Vite, SCSS, Rust/Actix backend
**State**: Window globals (`window.__CHOICELAB_DATA__`, `window.__CHOICELAB_VIEW__`) with manual `update()` callbacks threaded through props
**Tests**: None (no framework configured)
**Linting**: ESLint present but only covers `.js` files, not `.ts/.tsx`
**Formatting**: No formatter configured
**~131 TS/TSX files**, ~11,584 lines of code

---

## 1. Reliability & performance

### 1b. Replace Polling with Proper Async Coordination (Medium Impact, Medium Effort)

**Problem**: `src/fs/loadProjectData.ts` retries up to 550+ times in a loop, with `await delay()` sprinkled in, to wait for data to appear on `window.__CHOICELAB_DATA_RAW__`. This is a timing workaround, not a real solution.
**Fix**: Use a `Promise` that resolves when the data is available — either via a `window` custom event dispatched when data is set, or by restructuring the data-passing flow between windows using Tauri's `once()` listener pattern. This would be more deterministic, faster, and eliminate the loop entirely.
**File**: `src/fs/loadProjectData.ts`

### 1c. Add Project File Validation on Load (Medium Impact, Low Effort)

**Problem**: Loaded `.clx` project JSON is parsed and used directly with no schema validation. A malformed or outdated file can cause runtime errors deep in the app.
**Fix**: Add a lightweight validation step after parsing (checking required top-level keys, version compatibility). A `validateProject()` function that throws a user-friendly error before the project is mounted. No external schema library needed.
**Files**: `src/fs/loadProjectData.ts`, new `src/data/validateProject.ts`

### 1d. Add Error Boundaries (Medium Impact, Low Effort)

**Problem**: The entire Preact app has no error boundary. An unhandled exception in any component crashes the whole UI silently.
**Fix**: Wrap the root component (and potentially the inspector/flowchart subsystems) with Preact's `Component`-based error boundary, showing a recoverable error state rather than a blank screen. Preact supports the same `componentDidCatch` API as React.
**Files**: `src/main.tsx`, new `src/components/ErrorBoundary.tsx`

### 1e. Fix Recursive Node Position Calculation (Low Impact, Low Effort)

**Problem**: `positionNodes.ts` resolves x-coordinate conflicts by recursively calling itself with `x + 1` until no collision is found. With a large flowchart this could eventually stack overflow.
**Fix**: Convert to an iterative `while` loop.
**File**: `src/editor/flowchart/linking/positionNodes.ts`

---

## 2. Standardized Patterns

### 2a. Migrate State to Preact Signals (High Impact, High Effort)

**Problem**: The window global pattern with manual `update()` callbacks threaded through every component prop is the biggest source of complexity. It requires every caller to manually trigger re-renders, makes components tightly coupled to global state, and makes cross-window communication fragile.
**Fix**: Preact has a first-party reactive primitive — `@preact/signals` — that is a natural fit. Signals are reactive values that automatically re-render components that read them, eliminating the `update()` callback pattern. Because signals are module-level (not React Context), they work naturally in Tauri's multi-window architecture. The migration can be incremental: start with `ViewStore` (UI-only state), then migrate `Store` (project data). The window global pattern for cross-window data passing can stay for inter-window IPC specifically.
**Files**: `src/data/dataStore.ts`, `src/editor/MainEditor.tsx`, all component files that receive `update: Function` props. New `src/data/signals.ts`.

### 2b. Extend ESLint to TypeScript Files (High Impact, Low Effort)

**Problem**: `eslint.config.js` only targets `**/*.js`. The entire TypeScript codebase gets no lint coverage.
**Fix**: Add `typescript-eslint` to the config and extend rules to `*.ts` and `*.tsx` files. This unlocks type-aware lint rules that catch real bugs (e.g., unhandled promise rejections, `any` type spread, unused variables).

```bash
yarn add -D typescript-eslint
```

**File**: `eslint.config.js`

### 2c. Add a Code Formatter (High Impact, Low Effort)

**Problem**: No formatter is configured. Code style consistency depends entirely on individual IDE settings.
**Fix**: Add Prettier (or Biome as a combined lint+format tool). Add a `format` script to `package.json`.
**Files**: New `.prettierrc`, updated `package.json`

### 2d. Replace `any` Types and `@ts-ignore` (Medium Impact, Medium Effort)

**Problem**: `Action.props` and `Rule.value` use `{ [key: string]: any }`, and there are 6 `@ts-ignore` workarounds. These are holes in the type safety that strict mode was meant to prevent.
**Fix**: Create discriminated union types or generic constraints for action props (keyed by action type). Replace `@ts-ignore` instances one at a time with proper types or explicit `unknown` casts with runtime checks.
**Files**: `src/typings.ts`, affected components

### 2e. Consolidate `getData.ts` Query Patterns (Low Impact, Low Effort)

**Problem**: `src/data/getData.ts` (272 lines) has many repetitive lookup functions that all follow the same `array.find()` pattern.
**Fix**: Extract a generic `findById<T>()` utility and use it throughout. Reduces the file by ~30% and makes the pattern explicit.
**File**: `src/data/getData.ts`

---

## 3. Developer Experience

### 3a. Add Vitest for Unit Testing (High Impact, Medium Effort)

**Problem**: Zero test coverage. The data layer (`getData.ts`, `createNode.ts`, `history.ts`, `deleteData.ts`) and utility functions are pure functions that are trivially testable and represent the highest-value coverage.
**Fix**: Add Vitest (shares Vite config, zero extra setup needed). Start by testing the data layer and utility functions.

```bash
yarn add -D vitest
```

**Files**: New `src/**/*.test.ts` files; updated `package.json` with `"test": "vitest"` script.

### 3b. Add Pre-commit Hooks (Medium Impact, Low Effort)

**Problem**: Lint and format checks only run manually. Bad code can be committed without any gate.
**Fix**: Add `husky` + `lint-staged` to run ESLint + Prettier on staged files before each commit.

```bash
yarn add -D husky lint-staged
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
| 1   | Extend ESLint to TypeScript                      | Low    | High DX + reliability      |
| 3   | Add Prettier                                     | Low    | Medium DX                  |
| 4   | Add `.editorconfig`                              | Low    | Low DX                     |
| 5   | Add Vitest + data layer tests                    | Medium | High long-term reliability |
| 6   | Project file validation on load                  | Low    | Medium reliability         |
| 7   | Add Preact error boundaries                      | Low    | Medium reliability         |
| 8   | Replace polling in loadProjectData               | Medium | Medium reliability         |
| 9   | Add pre-commit hooks                             | Low    | Medium DX                  |
| 10  | Fix recursive position calculation               | Low    | Low reliability            |
| 11  | Replace `any` / `@ts-ignore`                     | Medium | Medium reliability         |
| 12  | Migrate state to Preact Signals                  | High   | High (long-term)           |
| 13  | Consolidate getData patterns                     | Low    | Low DX                     |
| 14  | Break up `fonts.ts`                              | Low    | Low DX                     |

Items 1–9 can all be done independently and incrementally. Item 12 (Signals migration) is the highest-leverage long-term change but the most involved — best tackled after the others are in place.
