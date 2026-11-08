// User-facing text for file errors reported by the backend.
//
// The backend sorts I/O errors into the codes below (`FileErrorCode` in
// src-tauri/src/file_operations.rs; keep the two lists in sync). Temporary
// errors are retried there first, so these only appear when retrying didn't
// help.
//
// Write copy in `fileErrorText`. `{name}` is replaced with the name of the
// file or project the message is about.

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
}

export interface FileErrorText {
  title: string;
  body: string;
}

const fileErrorText: Record<FileErrorCode, FileErrorText> = {
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
  },
  "read-only": {
    title: "{name} is on a disk that can't be written to.",
    body: "Save it to a different location instead.",
  },
  "name-too-long": {
    title: "The location of {name} has too long a name.",
    body: "Try saving it to a folder with a shorter name or path.",
  },
  "invalid-name": {
    title: "{name} has a name that can't be saved.",
    body: "Try a different name without special characters, such as punctuation or accent marks.",
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
    typeof error.message === "string"
  );
}

/**
 * Get user-facing text for an error from a file command. Anything that isn't
 * a recognized `FileError` gets the "unknown" text.
 */
export function getFileErrorText(error: unknown, name: string): FileErrorText {
  const text = fileErrorText[isFileError(error) ? error.code : "unknown"];
  return {
    title: text.title.split("{name}").join(name),
    body: text.body.split("{name}").join(name),
  };
}
