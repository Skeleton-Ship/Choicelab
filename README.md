# Choicelab

Choicelab lets you make branching narratives, then publish them on the web, where they'll play on any device or screen.

Under the hood, Choicelab uses [Tauri](https://tauri.app), a framework for building cross-platform apps. It's sort of like Electron, in that the UI is built with HTML, CSS, and JavaScript — but the generated apps are much faster and _much_ smaller.

On the frontend side, the app is developed with TypeScript, [Preact](https://preactjs.com) as a UI framework, and [Vite](https://vite.dev) as a build tool.

As of 2025, it is **macOS only**.

## Setup

You'll need a Mac running macOS 14 or later, as well as:

- [NodeJS] 22 or later
- [Rust](https://formulae.brew.sh/formula/rust#default) 1.87 or later
- [Yarn](https://classic.yarnpkg.com/en/)
- Xcode Command Line Tools (Run `xcode-select --install` from your command line)

## Development

- `yarn install-all` to install all dependencies for Rust + Node
- `yarn dev` to run the app locally
