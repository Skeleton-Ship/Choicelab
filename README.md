# Choicelab

Choicelab is a desktop app that lets writers and multimedia designers create rich branching narrative stories on their computer, then publish them on the web, where they'll play on any device or screen.

This, here, is the source code to the app. **You only need the below instructions if you want to develop Choicelab.** If you just want to use it like a normal app, head to [Choicelab.xyz](https://choicelab.xyz) to download!

Under the hood, Choicelab uses [Tauri](https://tauri.app), a framework for building cross-platform apps. It's sort of like Electron, in that the UI is typically written in HTML, CSS, and JavaScript — but because Tauri uses the system's native webview for rendering, the generated apps are much faster and _much_ smaller.

The frontend is written in [TypeScript](https://www.typescriptlang.org), with [Preact](https://preactjs.com) as a UI framework and [Vite](https://vite.dev) as a build tool. The backend handles basic setup, file management, and windowing, and is written in Rust like Tauri itself (with a sprinkle of Objective-C to provide Mac functionality that Tauri doesn't have yet).

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

Once you're in the repo, run:

- `bun install-all` to install all dependencies for Rust + Node
- `bun dev` to run the app locally

### Updating the branching logic vocabulary

Choicelab embeds a small word vector (based on [GloVe](https://nlp.stanford.edu/projects/glove/)) of common English words found in story questions and input choices (`vocab.json`). This enables the ability for Choicelab to automatically generate variables and branch stems for authors.

The GloVe-powered word list is committed to this repo; it only needs to be changed if the _target words_ in `classifyInputLabel.ts` change. To update the list, delete the existing `vocab.json`, then run `bun run gen-vocab` to download the full GloVe vector and regenerate the list.

## Building

You can run `bun build` to build a copy of the app locally, which is fine for your own testing purposes and to make sure the app runs. However, this build **won't be notarized**, so on macOS, you can't run it on another Mac unless you disable that Mac's Gatekeeper (which isn't acceptable for testing on other people's machines).

To avoid having to re-notarize the app manually each time, this repo uses the [Tauri GitHub action](https://github.com/tauri-apps/tauri-action). Each time there's a push to the **release** branch, the action will automatically build the app, send it to Apple for notarization (using credentials from Austin's Apple Developer account), and if approved, draft a release on GitHub that's ready for you to publish.

If you need fresh Apple Developer credentials, you'll add them as secret keys to this repo. See the Tauri action docs (above) for more.

## Deploying

Before publishing a new version, make sure you update the release notes in changelog.md. Then, add them to the app by running `bun run changelog`.

Run `bun run version-[version_type]` — substituting the type for _major_, _minor_, or _patch_ updates — to increment the app version across TypeScript and Rust.

Deploying automatic app updates requires creating a Tauri private and public key pair, then associating it with the [GitHub repo](https://github.com/Skeleton-Ship/Choicelab). You can generate a key pair by running `bun run keygen`; see [Tauri's updater docs](https://tauri.app/plugin/updater/#checking-for-updates) for more info on the full setup.

Once you successfully build the app (using the process above), merge into the **release** branch (per above), review the build, then publish.

## License

The Choicelab editor (everything outside of `src/player/`) is licensed under the **GNU General Public License v3.0 (GPL-3.0)**. See [LICENSE](LICENSE) for details.

The Choicelab player (`src/player/`) is licensed under the **MIT License**. This means you can embed the player in your own projects — including commercial or proprietary ones — without GPL obligations. See [src/player/LICENSE](src/player/LICENSE) for details.
