# Choicelab

Choicelab is a desktop app that lets writers and multimedia designers create rich branching narrative stories on their computer, then publish them on the web, where they'll play on any device or screen.

This, here, is the source code to the app. **You only need the below instructions if you want to develop Choicelab.** If you just want to use it like a normal app, head to [Choicelab.xyz](https://choicelab.xyz) to download!

Under the hood, Choicelab uses [Tauri](https://tauri.app), a framework for building cross-platform apps. It's sort of like Electron, in that the UI is typically written in HTML, CSS, and JavaScript — but because Tauri uses the system's native webview for rendering, the generated apps are much faster and _much_ smaller.

The frontend is written in [TypeScript](https://www.typescriptlang.org), with [Preact](https://preactjs.com) as a UI framework, [Vite](https://vite.dev) as a build tool, and [Sass](https://sass-lang.com) for styles. The backend handles basic setup, file management, windowing, and a local preview server, and is written in Rust like Tauri itself (with a sprinkle of Objective-C to provide Mac functionality that Tauri doesn't have yet).

A pre-built version of the app is available for both Mac and Windows.

## Setup

Development requires macOS 13.5 and newer, or Windows 11:

1. Follow Tauri's guide for [setup on macOS\*](https://v2.tauri.app/start/prerequisites/#macos) or [setup on Windows](https://v2.tauri.app/start/prerequisites/#windows). Then, continue reading there to [install Rust and Node.js](https://v2.tauri.app/start/prerequisites/#rust).
   - \* **Mac developers**: [Install the Xcode app](https://developer.apple.com/xcode/), _not_ just the command line tools. Tauri's docs state otherwise, but you'll need the full app because Choicelab uses some Objective-C.
2. Install [Bun](https://bun.sh/package-manager); you can run `bun` to see if you already have it installed.
3. Install [Git](https://git-scm.com/install), if you don't have it already. Any installation method should work.
4. **If you're using Windows on ARM**, two extra tools are required:
   - In the Visual Studio installer, go to Modify -> Individual Components, and select **"MSVC v143 - VS 2022 C++ ARM64/ARM64EC build tools (Latest)"**.
   - [Install LLVM for Windows on ARM](https://github.com/llvm/llvm-project/releases) — download the `woa64` installer and select "Add LLVM to the system PATH" during setup. This is required by the `ring` cryptography crate, which MSVC alone can't compile on ARM64.
5. Navigate to this repo in your terminal, then install dependencies with `bun install-all`.

## Development

Once you're in the repo, you'll probably use these commands most:

```bash
bun install-all     # Install all dependencies for Rust + Node
bun dev             # Run the app locally, with hot reloading (dev server on port 1420); also rebuilds the player (see below) whenever its source has changed
bun run typecheck   # Type-check the frontend and player
bun lint            # Run ESLint over src/
bun clean           # Run cargo clean; use this when Rust won't compile after big changes
```

In Choicelab, authors build flowcharts of **cells** (content nodes) and **branches** (conditional logic) connected by links. Projects are saved as `.clx` files (JSON), and are played by the bundled HTML5 player in `src/player/`. The player has its own Vite build; its compiled output in `src/player/dist/` isn't managed by Git, and is rebuilt by `bun dev` and `bun run build`.

Two sources of truth live in...let's call them _unexpected_ places. Every action's props, along with the inspector control and default for each, are defined in `src/editor/inspector/functions/internalActionDefs.ts`. Cell and project settings, and their defaults, are defined in `src/data/settingsDefs.ts`. The editor and the player both work from these definitions.

### Data model

Project file types live in `src/schema/project.ts`, which both the editor and the player import:

```
Project
├── settings { rememberHistory, appearance }
├── actions[]
├── variables[]
├── assets[]
└── sequences[]
    └── nodes: AnyNode[]  (StartNode | Cell | Branch, discriminated by `type`)
        ├── Cell { id, type, label, actions[], settings { transitionTime, navigationPoint }, link }
        ├── Branch { id, type, stems[] }
        │   └── Stem { id, type, match, rules[], link }
        │       └── Rule { id, type, variableId, operator, value }
        └── StartNode { id, type, link }
```

Note: This file must stay types-only (no imports, no runtime code), because the player bundles separately. `src/typings.ts` re-exports them alongside editor-only types.

Each project records a `schemaVersion`. When an older project is opened, `src/fs/migrateProject.ts` updates it step by step to the current version.

### State management

State lives in window globals:

- `window.__CHOICELAB_DATA__` — project data (`Store`)
- `window.__CHOICELAB_VIEW__` — UI/view state (`ViewStore`)
- `window.__CHOICELAB_FUNCTIONS__` — `{ updateProject, updateView }` callbacks

Read and write them with `getStore()` / `setStore()` / `getViewStore()` / `setViewStore()` from `src/data/dataStore.ts`, rather than touching the globals directly.

Components receive an `update: UpdateFunction` prop (`(updateHistory?, updatePreview?) => void`) that they must call after writing to the store to trigger a re-render. This is intentional (if fragile), so don't remove `update()` calls without understanding the render chain.

Separate windows, like project settings, communicate with the project window through Tauri's `emitTo()` / `once()` events.

### Conventions

- No explicit `any` and no `@ts-ignore`. Where a value is only known at runtime (e.g. an action prop looked up by its def's name), go through a typed helper like `getActionProp()` / `setActionProp()` rather than casting at each call site.
- The player only consumes what the app defines; it defines no props or settings of its own.
- Create domain objects with the factory functions in `src/data/createNode.ts`: `createCell()`, `createBranch()`, `createBranchStem()`, `createRule()`, `createStart()`, and `createAsset()`.
- All node IDs are UUIDs (via the `uuid` package).
- Action props and settings with a default are typed as required, because migrations guarantee they exist. When adding one, bump `CURRENT_SCHEMA_VERSION` and add a migration step that fills it in.
  - For example: `applyActionDefaults()` does this for action props.
- `project.name` is always overwritten from the `.clx` filename at load time (`src/main.tsx`), so don't rely on the value stored in the file itself.
- Window types are `"project" | "projectSettings" | "launcher" | "whatsNew" | "acknowledgments" | "license"`.
- SCSS variables and mixins are in `src/styles/base/variables.scss` and `mixins.scss`.

### Updating the branching logic vocabulary

Choicelab embeds a small word vector (based on [GloVe](https://nlp.stanford.edu/projects/glove/)) of common English words found in story questions and input choices (`vocab.json`). This enables the ability for Choicelab to automatically generate variables and branch stems for authors.

The GloVe-powered word list is committed to this repo; it only needs to be changed if the _target words_ in `classifyInputLabel.ts` change. To update the list, delete the existing `vocab.json`, then run `bun run gen-vocab` to download the full GloVe vector and regenerate the list.

## Known issues

- **No tests.** The data layer functions are pure though, and would be a good place to start.
- **Event listener cleanup.** Some `useEffect` hooks attach event listeners without returning a cleanup function.
- **Polling in `loadProjectData.ts`.** The project parse function retries in a loop (up to 600 times) waiting for data to appear on a window global. It works, but is fragile.

See [IMPROVEMENTS.md](IMPROVEMENTS.md) for a longer list of planned technical improvements.

## Release notes

`changelog.md` is used to generate release notes. When working on new features, make notes in it, with a `[draft]` prefix on the in-progress new version.

Write release notes _based on the impact to the user experience_, not the functional change to the codebase. Use the term "issue", not "bug" or "defect", but "crash" is fine when that's the case on the app or webview level. Purely technical updates with no user impact should be worded as "Various under-the-hood improvements to [broad category]" (where "category" could be, for example, flowchart rendering, data handling, etc).

## Building

You can run `bun run build` to build a copy of the app locally, which is fine for your own testing purposes and to make sure the app runs. However, this build **won't be notarized**, so on macOS, you can't run it on another Mac unless you disable that Mac's Gatekeeper (which isn't acceptable for testing on other people's machines).

To avoid having to re-notarize the app manually each time, this repo uses the [Tauri GitHub action](https://github.com/tauri-apps/tauri-action). Each time there's a push to the **release** branch, the action will automatically build the app, send it to Apple for notarization (using credentials from Austin's Apple Developer account), and if approved, draft a release on GitHub that's ready for you to publish.

If you need fresh Apple Developer credentials, you'll add them as secret keys to this repo. See the Tauri action docs (above) for more.

## Deploying

Before publishing a new version, make sure you update the release notes in changelog.md. Then, add them to the app by running `bun run changelog`.

Run `bun run version-[version_type]` — substituting `[version_type]` depending on whether it's a _major_, _minor_, or _patch_ update — to increment the app version across TypeScript and Rust. This also regenerates the changelog, and requires a clean working tree.

Deploying automatic app updates requires creating a Tauri private and public key pair, then associating it with the [GitHub repo](https://github.com/Skeleton-Ship/Choicelab). You can generate a key pair by running `bun run keygen`; see [Tauri's updater docs](https://tauri.app/plugin/updater/#checking-for-updates) for more info on the full setup.

Once you successfully build the app (using the process above), merge into the **release** branch (per above), review the build, then publish.

## License

The Choicelab editor (everything outside of `src/player/`) is licensed under the **GNU General Public License v3.0 (GPL-3.0)**. See [LICENSE](LICENSE) for details.

The Choicelab player (`src/player/`) is licensed under the **MIT License**. This means you can embed the player in your own projects — including commercial or proprietary ones — without GPL obligations. See [src/player/LICENSE](src/player/LICENSE) for details.

## For coding agents

Everything above applies to you, too. Additionally:

- **Check your work.** Run `bun run typecheck` after changes. `bun lint` currently reports pre-existing problems, so compare against the result before your change rather than expecting a clean run. The editor only runs inside Tauri, so say so when a change hasn't been tested in the running app.
- **No committing unless explicitly instructed to.** A human author must review all changes. Don't offer to commit, either.
  - It _is_ okay, however, to open a new branch if you're currently working from main.
- **Mind the release notes.** When you make a change, check `changelog.md`:
  - If the latest version has a `[draft]` flag, add notes to it following the guidelines in [Release notes](#release-notes).
  - If there's no draft flag and the latest changelog version matches the app version, offer to draft new notes.
  - If there's no draft flag and the version doesn't match the app version, ask before continuing.
- **Beware some large files.** `src/fonts/fonts.ts` is 1,400+ lines of flat font metadata, not logic. Avoid reading it in full.
