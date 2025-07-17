# Choicelab

Choicelab lets you make rich branching narratives, then publish them on the web, where they'll play on any device or screen.

Under the hood, Choicelab uses [Tauri](https://tauri.app), a framework for building cross-platform apps. It's sort of like Electron, in that the UI is built with HTML, CSS, and JavaScript — but the generated apps are much faster and _much_ smaller. While the app is mostly frontend, the backend is written in Rust (like Tauri) for handling basic setup, file management, and windowing — and a tiny bit of [Swift](https://developer.apple.com/swift/) to polyfill functionality Tauri doesn't have yet.

On the frontend side, the app is written in [TypeScript](https://www.typescriptlang.org), with [Preact](https://preactjs.com) as a UI framework and [Vite](https://vite.dev) as a build tool.

As of 2025, it is **macOS only**.

## Setup

You'll need a Mac running macOS 14 or later, as well as:

- [Node.js](https://formulae.brew.sh/formula/node#default) 22 or later
- [Rust](https://formulae.brew.sh/formula/rust#default) 1.87 or later
- [Yarn](https://classic.yarnpkg.com/en/)
- Xcode Command Line Tools (run `xcode-select --install` from your command line)

You can use any text editor you want; you don't need Xcode.

Install dependencies with `yarn install`, then run `yarn keygen` to generate a key for updates. (It's recommended that you leave the password field blank.)

## Development

Once you're in the repo, run:

- `yarn install-all` to install all dependencies for Rust + Node
- `yarn dev` to run the app locally

## Building

You can run `yarn build` to build a copy of the app locally, which is fine for your own testing purposes and to make sure the build passes. However, this build **won't be notarized**, so you can't run it on another Mac unless you [disable that Mac's Gatekeeper](https://macreports.com/how-to-disable-gatekeeper-on-mac-and-enable-the-anywhere-option-for-installing-any-software/) (which isn't acceptable for testing on other people's machines).

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
