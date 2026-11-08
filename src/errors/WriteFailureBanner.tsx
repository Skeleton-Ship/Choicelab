import { dismissWriteFailure, useVisibleWriteFailure } from "./writeFailures";

// Copy lives in src/fs/fileErrorText.ts (see `backgroundWriteLeads`)

/**
 * Tells the author when autosave or undo history can't be written, since
 * otherwise they'd have no way of knowing their safety net is gone.
 */
export function WriteFailureBanner() {
  const failure = useVisibleWriteFailure();
  if (!failure) return null;
  return (
    <div id="write-failure-banner" role="alert">
      <p>
        <strong>{failure.text.title}</strong> {failure.text.body}
      </p>
      <button
        class="ui-button"
        onClick={() => dismissWriteFailure(failure.kind)}
      >
        Dismiss
      </button>
    </div>
  );
}
