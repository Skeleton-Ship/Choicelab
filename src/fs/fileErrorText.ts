// User-facing text for file errors reported by the backend.
//
// The backend sorts I/O errors into the codes below (`FileErrorCode` in
// src-tauri/src/file_operations.rs; keep the two lists in sync). Temporary
// errors are retried there first, so these only appear when retrying didn't
// help.
//
// Write copy in `fileErrorText`. Placeholders:
// - `{name}`: the name of the file or project the message is about.
// - `{drive}`: the disk's name as Finder or Explorer shows it (e.g.
//   "Macintosh HD", "Local Disk (C:)"). Only available for errors about the
//   disk itself, and only used in `withDrive` text; the backend can't always
//   find it, so every entry also needs text that works without it.
// Don't add quotes around placeholders; they're added for you.

export type FileErrorCode =
  | "permission-denied"
  | "not-found"
  | "storage-full"
  | "read-only"
  | "name-too-long"
  | "invalid-name"
  | "busy"
  | "unknown";

export interface FileError {
  code: FileErrorCode;
  /** The OS's own description. For logs and "copy details", not user copy. */
  message: string;
  /** The disk's display name, for "storage-full" and "read-only" errors. */
  drive?: string;
}

export interface FileErrorText {
  title: string;
  body: string;
}

interface FileErrorTextEntry extends FileErrorText {
  /** Used instead when the disk's name is known. */
  withDrive?: FileErrorText;
}

const fileErrorText: Record<FileErrorCode, FileErrorTextEntry> = {
  "permission-denied": {
    title: "Choicelab doesn't have permission to save {name}.",
    body: "Check that you have access to the folder you wish to save to, then try again.",
  },
  "not-found": {
    title: "The folder for {name} couldn't be found.",
    body: "It may have been moved, renamed, or on a disk that's disconnected.",
  },
  "storage-full": {
    title: "Choicelab couldn't save {name} because your disk is full.",
    body: "Free up space on this disk, then try again.",
    withDrive: {
      title: "Choicelab couldn't save {name} because {drive} is full.",
      body: "Free up space on {drive}, then try again.",
    },
  },
  "read-only": {
    title: "{name} is on a disk that can't be written to.",
    body: "Save it to a different location instead.",
    withDrive: {
      title:
        "Choicelab couldn't save {name} because {drive} can't be written to.",
      body: "Save it to a different location instead.",
    },
  },
  "name-too-long": {
    title: "The location of {name} has too long a name.",
    body: "Try saving it to a folder with a shorter name or path.",
  },
  "invalid-name": {
    title: "{name} has a name that can't be saved.",
    body: "Try a different name without symbols such as / : * ? or |.",
  },
  busy: {
    title: "{name} is being used by another app.",
    body: "Close any other apps that might be using it, then try again.",
  },
  unknown: {
    title: "{name} couldn't be saved.",
    body: "Try again, or save it to a different location.",
  },
};

// Background writes: autosave and undo history. These go to Choicelab's cache
// folder, which the author never chose and can't do much about, so the save
// copy above ("check the folder", "save it somewhere else") doesn't fit.
// Instead, the banner shows one sentence built from two parts, joined with a
// space:
// - A lead saying what stopped working (`backgroundWriteLeads`). It has no
//   ending punctuation, since the sentence continues.
// - A follow-up (`backgroundWriteFollowUps`) that continues the sentence with
//   the cause, starting lowercase (e.g. "because the disk is full."), then
//   says what the author can do.
// Any lead must read correctly with any follow-up. `{name}` and `{drive}` work
// as above.

export type BackgroundWriteKind = "autosave" | "history";

const backgroundWriteLeads: Record<BackgroundWriteKind, string> = {
  autosave: "Choicelab can't auto-save {name}",
  history: "Choicelab can't undo or redo changes right now",
};

interface BackgroundWriteFollowUp {
  text: string;
  /** Used instead when the disk's name is known. */
  withDrive?: string;
}

/** For errors the author can't fix themselves. */
const saveRegularly: BackgroundWriteFollowUp = {
  text: "because of an issue in the background. Save your changes frequently, or try restarting Choicelab.",
};

const backgroundWriteFollowUps: Record<FileErrorCode, BackgroundWriteFollowUp> =
  {
    "permission-denied": saveRegularly,
    "not-found": saveRegularly,
    "storage-full": {
      text: "because the disk is full. Free up disk space before editing further, or changes may not be saved.",
      withDrive:
        "because {drive} is full. Free up disk space before editing further, or changes may not be saved.",
    },
    "read-only": saveRegularly,
    "name-too-long": saveRegularly,
    "invalid-name": saveRegularly,
    busy: {
      text: "because another app interrupted it. Choicelab will try again with your next change.",
    },
    unknown: saveRegularly,
  };

export function isFileError(error: unknown): error is FileError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string" &&
    error.code in fileErrorText &&
    "message" in error &&
    typeof error.message === "string" &&
    (!("drive" in error) || typeof error.drive === "string")
  );
}

/** Wrap a name in curly quotes, e.g. “My Story”. */
function quoteName(name: string): string {
  return `\u201C${name}\u201D`;
}

function fillPlaceholders(
  text: string,
  values: Record<string, string>
): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.split(`{${key}}`).join(quoteName(value)),
    text
  );
}

function placeholderValues(
  error: FileError | undefined,
  name: string
): Record<string, string> {
  return error?.drive ? { name, drive: error.drive } : { name };
}

/**
 * Get user-facing text for a failed autosave or undo history write. `title`
 * (what stopped working) and `body` (why, and what to do) form one sentence
 * when joined with a space.
 */
export function getBackgroundWriteErrorText(
  kind: BackgroundWriteKind,
  error: unknown,
  name: string
): FileErrorText {
  const fileError = isFileError(error) ? error : undefined;
  const followUp =
    backgroundWriteFollowUps[fileError ? fileError.code : "unknown"];
  const body =
    fileError?.drive && followUp.withDrive ? followUp.withDrive : followUp.text;
  const values = placeholderValues(fileError, name);
  return {
    title: fillPlaceholders(backgroundWriteLeads[kind], values),
    body: fillPlaceholders(body, values),
  };
}

/**
 * Get user-facing text for an error from a file command. Anything that isn't
 * a recognized `FileError` gets the "unknown" text.
 */
export function getFileErrorText(error: unknown, name: string): FileErrorText {
  const fileError = isFileError(error) ? error : undefined;
  const entry = fileErrorText[fileError ? fileError.code : "unknown"];
  const text = fileError?.drive && entry.withDrive ? entry.withDrive : entry;
  const values = placeholderValues(fileError, name);
  return {
    title: fillPlaceholders(text.title, values),
    body: fillPlaceholders(text.body, values),
  };
}
