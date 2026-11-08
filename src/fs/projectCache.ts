import { invoke } from "@tauri-apps/api/core";
import { resolve } from "@tauri-apps/api/path";

// Each project's autosave, undo history, and preview files live in a cache
// folder whose name the backend decides (a hash of the project path). Always
// get it from here rather than building the path by hand.

const cacheDirs = new Map<string, Promise<string>>();

function getProjectCacheDir(projectPath: string): Promise<string> {
  let dir = cacheDirs.get(projectPath);
  if (!dir) {
    dir = invoke<string>("get_project_cache_dir", { projectPath });
    // Don't remember a failure; let the next call try again
    dir.catch(() => cacheDirs.delete(projectPath));
    cacheDirs.set(projectPath, dir);
  }
  return dir;
}

/**
 * Get a path inside the project's cache folder, e.g.
 * `getProjectCachePath(projectPath, "History", versionId)`.
 */
export async function getProjectCachePath(
  projectPath: string,
  ...segments: string[]
): Promise<string> {
  return resolve(await getProjectCacheDir(projectPath), ...segments);
}

/**
 * Write a file into the project's cache folder. Rejects with a `FileError`
 * (see `fileErrorText.ts`) if the write still fails after the backend's
 * retries.
 */
export function writeProjectCacheFile(
  projectPath: string,
  name: string,
  contents: string,
  subdir?: string
): Promise<void> {
  return invoke("write_project_cache_file", {
    projectPath,
    subdir: subdir ?? null,
    name,
    contents,
  });
}

/** Remove the project's cache folder. */
export function clearProjectCache(projectPath: string): Promise<void> {
  return invoke("clear_project_cache", { projectPath });
}
