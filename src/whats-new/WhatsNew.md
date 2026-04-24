## 1.0.0

### April 24, 2026

#### New features

- **Autofill** can analyze input buttons in a cell and automatically create variables and branch stems. Qualifying cells will show an "Autofill" button in the inspector, as well as enable a command in the Project menu.
- **Appearance controls** let you customize the look and feel of a project. Change the font, background color, the look of input buttons, and even add custom CSS to your project.
- **Exporting a project** is finally possible! An export will bundle your project, any assets, and the Choicelab player into a single directory you can upload to your own site, or a service like itch.io.
- **Windows support** is here! Use Choicelab on Windows 11, with the same functionality as the Mac version.

#### Enhancements

- The app now follows the system accent color for certain controls.
- Improved the appearance of the app icon, the launcher, and the app toolbar icons.
- The inspector now notifies if a cell will play very quickly (because it has visual elements, but no media or input actions to anchor them).
- In the flowchart and toolbar, the app now follows the system contrast setting.
- The app will now close when all windows are closed.
- Video actions can be set to _cover_ the whole screen, or _contain_ themselves in the viewport.
- Video and audio actions now have the ability to force a cell to end (useful for setting a timer on player choices).
- Buttons now show the label "Continue" by default.

#### Fixes

- Certain controls will now blur when a window isn't focused.
- Fixed an issue where a cell's settings wouldn't always show the correct values.
- Fixed an issue where text fields with quotes would show an escape character on open.
- Fixed an issue where a missing Assets folder would cause the app to stop working.