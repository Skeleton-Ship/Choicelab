## 1.1

### May 16, 2026

#### New features

- Projects now **auto-save**, and will offer to restore the auto-saved version if Choicelab quits unexpectedly.
- Added **Open Recent** and **Save As** commands to the menu.

#### Enhancements

- The prompt to save a project now shows the standard Save, Don't Save, and Cancel commands.
- Captions will now appear for media when a WebVTT (.vtt) file is slotted.
- When slotting an action into a cell, the cell pane will now scroll to the action, highlight its addition, and focus the first input element.
- Text fields now support undo/redo while editing, not just after saving.
- Audio and video actions in the editor will now indicate when they're loading.
- Improved performance of text editing when dealing with large flowcharts.
- Improved reliability of undo/redo.

#### Fixes

- Fixed an issue where pressing Delete while the preview window was open would cause the editor to...completely disappear and make the app unusable. (!)
- Fixed an issue where Choicelab would refuse to quit if only the launcher was open.
- The launcher no longer enables project-specific menu items that aren't relevant to that window.
- Fixed an issue with the positioning and appearance of disconnected branch cells.
- Fixed the keyboard shortcuts for Delete Node and Delete Branch Stem.
- If slotting a cloud-based file fails, Choicelab will now show a help message and cancel the operation, instead of hanging.
- Projects played back locally will now automatically reset their playback history when uploaded to a web server.