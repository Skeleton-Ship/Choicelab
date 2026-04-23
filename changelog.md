# Changelog

## 0.7

#### 2026-04-23

###### New features

- **Autofill** can analyze input buttons in a cell and automatically create variables and branch stems. Qualifying cells will show an "Autofill" button in the inspector, as well as enable a command in the Project menu.
- **Appearance controls** let you customize the look and feel of a project. Change the font, background color, the look of input buttons, and even add custom CSS to your project.
- **Exporting a project** is finally possible! An export will bundle your project, any assets, and the Choicelab player into a single directory you can upload to your own site, or a service like itch.io.
- **Preliminary Windows support** is here! Use Choicelab on Windows 11, with most all of the functionality of the Mac version.

###### Enhancements

- The app now follows the system accent color for certain controls.
- The inspector now notifies if a cell will play very quickly (because it has visual elements, but no media or input actions to anchor them).
- In the flowchart and toolbar, the app now follows the system contrast setting.
- Video actions can be set to _cover_ the whole screen, or _contain_ themselves in the viewport.
- Video and audio actions now have the ability to force a cell to end (useful for setting a timer on player choices).
- Buttons now show the label "Continue" by default.

##### Fixes

- Certain controls will now blur when the window is not focused.
- Fixed an issue where a cell's settings wouldn't always show the correct values.
- Fixed an issue where a missing Assets folder would cause the app to stop working.

## 0.6

#### 2025-07-16

- The app now supports **automatic updates**, and will prompt when a new version is available.
- You can see what's new in Choicelab by going to Help -> Release Notes.
- Now in beta: Visual elements (like text) can be positioned in a 3x3 grid, using the Position control.
- **Important**: Choicelab projects now end in `.clx` instead of `.json`, and the `assets` folder has been renamed `Assets`. In Choicelab, the CLX file is now what you select when opening a project.
- You can also now open CLX files from the Finder (as long as Choicelab is currently closed).
- The default project window size is now larger, and the minimum size has been increased slightly.
- Fixed some issues related to automatic media playback.

## 0.5.2

#### 2025-05-28

- Media files displayed in the sidebar now load much faster.
- Fixed an issue that caused the Window and Help menus to constantly disappear and re-appear.
- Fixed an issue that caused the preview window to not show the correct cell when navigating from a branch to a cell.

## 0.5.1

#### 2025-05-27

- Fixed an issue that caused some text to not appear in preview.
- Fixed an issue where toggling preview on a non-start cell wouldn't show the selected cell until selected again.

## 0.5.0

#### 2025-05-27

- The Choicelab player now supports timeable actions.
- Previewing has been improved, so you can now:
  - Preview from any cell, not just the start
  - See the preview embedded in the main window
  - Open the preview in your full browser, instead of a limited window
- The Window menu now includes all of the standard macOS commands.
- The title bar in a project window will now reflect when the project has been edited but not saved.
- Web previews will now automatically update to the latest player version when a project is loaded.
- Improved the appearance of the actions list in a cell.
- Fixed an issue where some visual elements (waveforms and icons) would not load.
- Fixed an issue where multi-line text fields would not refresh when invoking undo/redo.

## 0.4.0

#### 2025-04-17

- Internal: Players can now add their own props to actions.
- In the editor, timeable actions (text, images, inputs) can now be timed to media actions (video, audio).
  - Player support is forthcoming!
- Added waveforms for slotted audio actions.

## 0.3.0

#### 2024-08-27

- First version of preview functionality. Press the ▶️ button in the toolbar to open the project in a web view, and test a project from its start point.
- Cells now feature transition time and navigation point settings that allow for greater control over the pacing and navigation of a project.
- Improved the flowchart appearance, including decreasing the gap between nodes and making some elements responsive to the view size.
- Available actions now appear in a more compact view, to allow room for cell settings and more room for action editing.
- Revised text roles to Title, Heading, Subheading, and Body Text instead of HTML tags.
- A placeholder message will now be shown if there are no actions in a cell.
- Fixed an issue where actions that control variables would not automatically set a default value.

## 0.2.2

#### 2024-08-12

- Fixed an issue where numbers added to rules would not parse correctly.

## 0.2.1

#### 2024-08-11

- Fixed an issue where special characters (like double quotes, and newlines) weren't properly escaped during project save.

## 0.2.0

#### 2024-08-11

- Add support for the Silence action, which can eventually be used to time visual elements without any accompanying audio or video.

## 0.1.3

#### 2024-01-17

- Fixed an issue where the new project dialog would not open in macOS Ventura.

## 0.1.2

#### 2024-01-04

- Fixed an issue that resulted in projects not opening in macOS Monterey and older.

## 0.1.1

#### 2024-01-03

- No-match branch stems now appear last in the branch order, and are deletable with the shortcut Cmd+Option+Del.

## 0.1.0

#### 2024-01-03

- Initial release.
