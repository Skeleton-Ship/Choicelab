## 1.2

### November 14, 2026

#### New features

- You can now **insert a variable into Text and Button labels.** Type _{_ or choose _Edit -> Insert Variable_ to insert one, and it will fill in the value in the player. Variable names will stay up to date even if the variable is renamed.
- Variable names are more flexible — allowing spaces and capital letters — and appear as regular text instead of code.
- You can now check for updates at any time with **Choicelab -> Check for Updates...** on macOS, or **Help -> Check for Updates...** on Windows.

#### Enhancements

- Opening a project that was saved with a newer version of Choicelab now explains that an update is needed, instead of opening it incorrectly.
- Scrollbars throughout the app are now smaller and cleaner, and respect the system's increase-contrast setting.
- Adding media files to a project, previewing them in the editor, and opening projects that contain media are faster and use much less memory and disk space.
- Body text now shows as separate paragraphs, with **Shift-Return** adding a line break within one. Existing text looks the same as before.
- New variables and rules now scroll into view and auto-select their name for easier input.
- Deleting a variable that's used by actions, text, or branch stems
  now asks for confirmation first, and shows how many places use it.
- When setting a node's link, pressing Escape now cancels the action, the panel's positioning is improved, and linkable nodes are now easier to see.
- A No Match stem is now optional, and can be deleted like any other stem. To add one, press **Add No-Match Stem** at the bottom of the branch inspector, Option-click a branch's **+** button, or hold down Option while navigating the Project menu.
- New branches now start with a single empty stem, instead of a **No Match** stem.
- Clicking a rule in the Rules pane now selects its branch stem in the flowchart, matching the existing behavior in the other direction.
- In the flowchart, text actions now appear in bold only when their role is Heading or Subheading, so body text is easier to tell apart.
- Leading and trailing spaces are now automatically trimmed from text values in rules and in actions that set a variable (which could lead to conditions that look correct but fail to match).
- On Windows, a project window's title now starts with an asterisk (\*) when it has unsaved changes.
- If Choicelab stops working unexpectedly, it now explains what happened and offers to reload, auto-saving your changes first.
- You can now undo and redo project settings.
- Various improvements to reliability of auto-save, export, and project creation and loading.
- Choicelab no longer offers an update that your computer's operating system can't run. **Check for Updates...** explains when this is the case.
- Various under-the-hood improvements to project handling, undo/redo, app update security, as well as app frameworks and dependencies.

#### Fixes

- Choosing the currently open project from **Open Recent** no longer prompts you to close and reopen it.
- The preview no longer flashes when opened or refreshed.
- Fixed an issue on macOS where opening a project with media could leave the app unresponsive and lead to an unexpected window appearance.
- On Windows, keyboard shortcuts for menu commands now work reliably (after, uh, not working not very well at all).
- Changing a variable's type to Number no longer incorrectly keeps its previous starting value, and will now reset to 0.
- Deleting a variable now removes the variable from any actions or rules that used it.
- Fixed an issue where a rule using **!=** with a number variable matched when the values were equal, instead of when they were different.
- Fixed an issue where adding a large media file could incorrectly show a warning about downloading it from the cloud.
- Cached media files are now properly removed from disk.
- Fixed a few rare instances where auto-save, undo, and the preview could stop working when a project 1) is stored in deeply nested folders, 2) has a project with a similar name, or 3) was modified by cleanup or sync applications.
- Fixed an issue where a project could appear saved, and close without warning, when it actually couldn't be saved.
- Fixed an issue where **Save As** could close the open project without saving it if the new location couldn't be written to.
- Fixed a few rare crashes that could happen when a window closed while it was still loading.
- The Custom CSS editor in Project Settings now correctly responds to deletions and undo/redo.
- Fixed an issue where changing a project setting cleared the undo history, so earlier changes in the flowchart couldn't be undone.