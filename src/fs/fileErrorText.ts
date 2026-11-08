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
      title: "Choicelab couldn't save {name} because {drive} can't be written to.",
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

function fillPlaceholders(text: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.split(`{${key}}`).join(quoteName(value)),
    text
  );
}

/**
 * Get user-facing text for an error from a file command. Anything that isn't
 * a recognized `FileError` gets the "unknown" text.
 */
export function getFileErrorText(error: unknown, name: string): FileErrorText {
  const fileError = isFileError(error) ? error : undefined;
  const entry = fileErrorText[fileError ? fileError.code : "unknown"];
  const drive = fileError?.drive;
  const text = drive && entry.withDrive ? entry.withDrive : entry;
  const values: Record<string, string> = drive ? { name, drive } : { name };
  return {
    title: fillPlaceholders(text.title, values),
    body: fillPlaceholders(text.body, values),
  };
}
