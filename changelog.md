# Changelog

## 1.0.3

### 2026-05-10

#### Enhancements

- When slotting an action into a cell, the cell pane will now scroll to the action, highlight its addition, and focus the first input element.
- Text fields now support undo/redo while editing, not just after saving.
- Audio and video actions in the editor will now indicate when they're loading.
- Improved performance of text editing when dealing with large flowcharts.

#### Fixes

- Fixed an issue where pressing Delete while the preview window was open would cause the editor to...completely disappear and make the app unusable. (!)
- Fixed an issue where Choicelab would refuse to quit if only the launcher was open.
- Fixed the keyboard shortcuts for Delete Node and Delete Branch Stem.
- Projects played back locally will now automatically reset their playback history when uploaded to a web server.

## 1.0.2

### 2026-05-08

#### New features

- Choicelab now features a **consistent aspect ratio** and **more flexible element positioning**. Your project will look the same on any device, at any size.
- **Note**: Due to the new element positioning, the grid has been removed. Existing grid elements will be back-ported into approximate positions.
- Actions are now sorted into three categories: **Timeline** (actions that affect a cell's duration), **Interact** (actions the viewer/player will interact with), and **Event** (instantaneous events on the timeline).

#### Fixes

- Fixed an issue that caused opening the app to crash on Macs with Intel processors.
- Improved label text for cell settings.
- Improved label text for video and audio actions force-ending cells.
- The text in selected toolbar buttons is now easier to read in dark mode.
- Autofill will no longer generate duplicate values for button labels.
- Font picker labels will no longer overflow the dropdown.

## 1.0.1

### 2026-05-07

#### Enhancements

- The Assets folder is more flexible: the app will no longer warn if unregistered assets are in the folder, and you can register assets nested in folders while preserving their original position.
- The app will warn if it's unable to auto-update, with a prompt to download the newest version from the website.

#### Fixes

- Font sizes now correctly default to preset values, not the internal CSS variables.
- Fixed an issue where headings and subheadings weren't being properly rendered or styled.

## 1.0.0

### 2026-05-02

#### New features

- **Autofill** can analyze input buttons in a cell and automatically create variables and branch stems. Qualifying cells will show an "Autofill" button in the inspector, as well as enable a command in the Project menu.
- **Appearance controls** let you customize the look and feel of a project. Change the font, background color, the look of input buttons, and even add custom CSS to your project.
- **Background audio and video** actions let you persist media across cells: useful for ambience and video backgrounds.
- **Exporting a project** is finally possible. An export will bundle your project, any assets, and the Choicelab player into a single directory you can upload to your own site, or a service like itch.io.
- **Windows support** is here! Use Choicelab on Windows 11, with the same functionality as the Mac version.

#### Enhancements

- The help menu now includes a link to Choicelab's documentation, website, and GitHub repository.
- Choicelab is now officially licensed under the GPLv3 (for the app), and the MIT License (for the player). See the GitHub repository link for more details.
- The app now follows the system accent color for certain controls.
- Improved the appearance of the app icon, the launcher, and the app toolbar icons.
- The inspector now notifies if a cell will play very quickly (because it has visual elements, but no media or input actions to anchor them).
- In the flowchart and toolbar, the app now follows the system contrast setting.
- The app will now close when all windows are closed.
- Video actions can now be muted, set their build appearance, as well as be set to _cover_ the whole screen, or _contain_ themselves in the viewport.
- Video and audio actions now have the ability to force a cell to end (useful for setting a timer on player choices).
- Buttons now show the label "Continue" by default.

#### Fixes

- Certain controls will now blur when a window isn't focused.
- The timed actions pane will now only appear when there are qualifying actions in the cell.
- Renaming the project file on disk will now correctly rename the project on save, and not generate a duplicate with the old name.
- Fixed an issue where a cell's settings wouldn't always show the correct values.
- Fixed an issue where text fields with quotes would show an escape character on open.
- Fixed an issue where a missing Assets folder would cause the app to stop working.
- Fixed an issue where it wasn't possible to type decimals into qualifying number fields.

## 0.6

### 2025-07-16

- The app now supports **automatic updates**, and will prompt when a new version is available.
- You can see what's new in Choicelab by going to Help -> Release Notes.
- Now in beta: Visual elements (like text) can be positioned in a 3x3 grid, using the Position control.
- **Important**: Choicelab projects now end in `.clx` instead of `.json`, and the `assets` folder has been renamed `Assets`. In Choicelab, the CLX file is now what you select when opening a project.
- You can also now open CLX files from the Finder (as long as Choicelab is currently closed).
- The default project window size is now larger, and the minimum size has been increased slightly.
- Fixed some issues related to automatic media playback.

## 0.5.2

### 2025-05-28

- Media files displayed in the sidebar now load much faster.
- Fixed an issue that caused the Window and Help menus to constantly disappear and re-appear.
- Fixed an issue that caused the preview window to not show the correct cell when navigating from a branch to a cell.

## 0.5.1

### 2025-05-27

- Fixed an issue that caused some text to not appear in preview.
- Fixed an issue where toggling preview on a non-start cell wouldn't show the selected cell until selected again.

## 0.5.0

### 2025-05-27

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

### 2025-04-17

- Internal: Players can now add their own props to actions.
- In the editor, timeable actions (text, images, inputs) can now be timed to media actions (video, audio).
  - Player support is forthcoming!
- Added waveforms for slotted audio actions.

## 0.3.0

### 2024-08-27

- First version of preview functionality. Press the ▶️ button in the toolbar to open the project in a web view, and test a project from its start point.
- Cells now feature transition time and navigation point settings that allow for greater control over the pacing and navigation of a project.
- Improved the flowchart appearance, including decreasing the gap between nodes and making some elements responsive to the view size.
- Available actions now appear in a more compact view, to allow room for cell settings and more room for action editing.
- Revised text roles to Title, Heading, Subheading, and Body Text instead of HTML tags.
- A placeholder message will now be shown if there are no actions in a cell.
- Fixed an issue where actions that control variables would not automatically set a default value.

## 0.2.2

### 2024-08-12

- Fixed an issue where numbers added to rules would not parse correctly.

## 0.2.1

### 2024-08-11

- Fixed an issue where special characters (like double quotes, and newlines) weren't properly escaped during project save.

## 0.2.0

### 2024-08-11

- Add support for the Silence action, which can eventually be used to time visual elements without any accompanying audio or video.

## 0.1.3

### 2024-01-17

- Fixed an issue where the new project dialog would not open in macOS Ventura.

## 0.1.2

### 2024-01-04

- Fixed an issue that resulted in projects not opening in macOS Monterey and older.

## 0.1.1

### 2024-01-03

- No-match branch stems now appear last in the branch order, and are deletable with the shortcut Cmd+Option+Del.

## 0.1.0

### 2024-01-03

- Initial release.
