# Choicelab

Choicelab lets you make rich branching narratives, then publish them on the web, where they'll play on any device or screen.

Under the hood, Choicelab uses [Tauri](https://tauri.app), a framework for building cross-platform apps. It's sort of like Electron, in that the UI is typically written in HTML, CSS, and JavaScript — but because Tauri uses the system's native webview for rendering, the generated apps are much faster and _much_ smaller.

The frontend is written in [TypeScript](https://www.typescriptlang.org), with [Preact](https://preactjs.com) as a UI framework and [Vite](https://vite.dev) as a build tool. The backend handles basic setup, file management, and windowing, and is written in Rust like Tauri itself (with a sprinkle of [Swift](https://developer.apple.com/swift/) to polyfill functionality Tauri doesn't have yet).

A pre-built _alpha_ version of the app is available for both Mac and Windows.

## Setup

Development requires macOS 14 and newer, or Windows 10 (version 22H2) and 11:

1. Follow Tauri's guide for [setup on macOS](https://v2.tauri.app/start/prerequisites/#macos) — you can use their "Only developing for desktop targets" aside to speed things up — or [setup on Windows](https://v2.tauri.app/start/prerequisites/#windows). Then, continue reading there to [install Rust and Node.js](https://v2.tauri.app/start/prerequisites/#rust).
2. Install [Bun](https://bun.sh/package-manager); you can run `bun` to see if you already have it installed.
3. Install [Git](https://git-scm.com/install), if you don't have it already. Any installation method should work.

From this repo, install dependencies with `bun install-all`. Then, run `bun keygen` to generate a key for deploying automatic updates. (It's recommended that you leave the password field blank.)

## Development

Once you're in the repo, run:

- `bun install-all` to install all dependencies for Rust + Node
- `bun dev` to run the app locally

## Building

You can run `bun build` to build a copy of the app locally, which is fine for your own testing purposes and to make sure the app runs. However, this build **won't be notarized**, so on macOS, you can't run it on another Mac unless you disable that Mac's Gatekeeper (which isn't acceptable for testing on other people's machines).

To avoid having to re-notarize the app manually each time, this repo uses the [Tauri GitHub action](https://github.com/tauri-apps/tauri-action). Each time there's a push to the **release** branch, the action will automatically build the app, send it to Apple for notarization (using credentials from Austin's Apple Developer account), and if approved, draft a release on GitHub that's ready for you to publish.

If you need fresh Apple Developer credentials, you'll add them as secret keys to this repo. See the Tauri action docs (above) for more.

## Deploying

Deploying automatic app updates requires creating a Tauri private key, then associating it with the [choicelab-app repo on GitHub](https://github.com/austinheller/choicelab-app). See [Tauri's updater docs](https://tauri.app/plugin/updater/#checking-for-updates) for more info.

Once you successfully build the app (using the process above):

1. From GitHub, go to the [Releases page in the choicelab-releases repo](https://github.com/austinheller/choicelab-releases/releases).
2. Verify the release assets are correct, then publish it.
3. Take the `latest.json` file, and upload it to the `releases.choicelab.xyz` S3 bucket, in the `/latest` subdirectory.
   - This bucket is owned by Austin's AWS account. Talk to them for the access key.

**Important**: Amazon S3 caches its resources, so the S3-mirroring CloudFront URL that the app checks for updates — releases.choicelab.xyz/latest/latest.json — doesn't always immediately show the latest JSON. You can force S3 to clear its cache by going to CloudFront in AWS, and [creating an invalidation](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation_Requests.html).
