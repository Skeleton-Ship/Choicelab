import { useEffect, useState } from "preact/hooks";
import {
  BackgroundWriteKind,
  FileErrorText,
  getBackgroundWriteErrorText,
} from "../fs/fileErrorText";

// Background writes that keep the author's work safe (autosave, undo history)
// fail quietly unless something says so. Failures are recorded here and shown
// by WriteFailureBanner until the next successful write clears them.

export type WriteFailureKind = BackgroundWriteKind;

export interface WriteFailure {
  kind: WriteFailureKind;
  text: FileErrorText;
  dismissed: boolean;
}

const failures = new Map<WriteFailureKind, WriteFailure>();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

/** Record a failed background write. */
export function reportWriteFailure(
  kind: WriteFailureKind,
  error: unknown,
  projectName: string
) {
  const existing = failures.get(kind);
  failures.set(kind, {
    kind,
    text: getBackgroundWriteErrorText(kind, error, projectName),
    // Once dismissed, stay dismissed until a write works again, rather than
    // reappearing on every edit
    dismissed: existing?.dismissed ?? false,
  });
  notify();
}

/** Clear a failure after a write of that kind works again. */
export function clearWriteFailure(kind: WriteFailureKind) {
  if (failures.delete(kind)) notify();
}

export function dismissWriteFailure(kind: WriteFailureKind) {
  const failure = failures.get(kind);
  if (!failure) return;
  failures.set(kind, { ...failure, dismissed: true });
  notify();
}

/** The failure to show, if any. Autosave failures come first. */
function getVisibleFailure(): WriteFailure | undefined {
  return [failures.get("autosave"), failures.get("history")].find(
    (failure) => failure && !failure.dismissed
  );
}

export function useVisibleWriteFailure(): WriteFailure | undefined {
  const [failure, setFailure] = useState(getVisibleFailure);
  useEffect(() => {
    const listener = () => setFailure(getVisibleFailure());
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return failure;
}
