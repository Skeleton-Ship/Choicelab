/*
 * Checks for, and installs, app updates.
 *
 * The update manifest (latest.json) can carry an extra field that the updater
 * plugin doesn't know about:
 *
 *   "minimumSystemVersion": { "macos": "13.5", "windows": "10.0.22000" }
 *
 * It's added by the release workflow (scripts/updater-manifest.cjs). If this
 * machine's OS is older than the minimum for its platform, the update is never
 * offered, because installing it would leave an app that can't launch.
 */

use serde::Serialize;
use std::cmp::Ordering;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, State};
use tauri_plugin_updater::{Update, UpdaterExt};

/// Applies to the update check only, not the download, which can take a while.
const CHECK_TIMEOUT: Duration = Duration::from_secs(30);

/// The update found by the last check, so the user installs exactly the
/// release they were offered (not whatever is newest by the time they click).
#[derive(Default)]
pub struct PendingUpdate(Mutex<Option<Update>>);

#[derive(Serialize)]
#[serde(tag = "kind", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum UpdateStatus {
    UpToDate {
        current_version: String,
    },
    Available {
        version: String,
    },
    /// An update exists, but this machine's OS is too old to run it.
    Unsupported {
        version: String,
        minimum_system_version: String,
    },
}

/// Compares dotted numeric versions ("13.5" vs "13.5.1"). Missing segments
/// count as 0. Returns None if either isn't a dotted number.
fn compare_versions(a: &str, b: &str) -> Option<Ordering> {
    fn parse(v: &str) -> Option<Vec<u64>> {
        v.trim().split('.').map(|s| s.parse::<u64>().ok()).collect()
    }
    let (a, b) = (parse(a)?, parse(b)?);
    let len = a.len().max(b.len());
    for i in 0..len {
        let ord = a.get(i).unwrap_or(&0).cmp(b.get(i).unwrap_or(&0));
        if ord != Ordering::Equal {
            return Some(ord);
        }
    }
    Some(Ordering::Equal)
}

/// The minimum OS version the update requires on this platform, if the
/// manifest specifies one.
fn minimum_system_version(update: &Update) -> Option<String> {
    update
        .raw_json
        .get("minimumSystemVersion")?
        .get(std::env::consts::OS)?
        .as_str()
        .map(str::to_string)
}

/// Whether this machine meets the minimum. Fails closed: if either version
/// can't be read, the update isn't installed, since a wrong guess could leave
/// the user with an app that won't open. They can still update manually.
fn meets_minimum(minimum: &str) -> bool {
    let current = tauri_plugin_os::version().to_string();
    matches!(
        compare_versions(&current, minimum),
        Some(Ordering::Greater | Ordering::Equal)
    )
}

#[tauri::command]
pub async fn check_for_update(
    app: AppHandle,
    pending: State<'_, PendingUpdate>,
) -> Result<UpdateStatus, String> {
    let update = app
        .updater_builder()
        .timeout(CHECK_TIMEOUT)
        .build()
        .map_err(|e| e.to_string())?
        .check()
        .await
        .map_err(|e| e.to_string())?;

    let status = match &update {
        None => UpdateStatus::UpToDate {
            current_version: app.package_info().version.to_string(),
        },
        Some(update) => match minimum_system_version(update) {
            Some(minimum) if !meets_minimum(&minimum) => UpdateStatus::Unsupported {
                version: update.version.clone(),
                minimum_system_version: minimum,
            },
            _ => UpdateStatus::Available {
                version: update.version.clone(),
            },
        },
    };

    // Only keep updates that are allowed to be installed
    let installable = match status {
        UpdateStatus::Available { .. } => update,
        _ => None,
    };
    *pending.0.lock().unwrap() = installable;
    Ok(status)
}

/// Downloads and installs the update found by the last check, then relaunches.
/// Callers are responsible for handling unsaved changes first.
#[tauri::command]
pub async fn install_update(
    app: AppHandle,
    pending: State<'_, PendingUpdate>,
) -> Result<(), String> {
    let update = pending.0.lock().unwrap().take();
    let Some(mut update) = update else {
        return Err("No update is ready to install.".into());
    };
    // The check timeout would otherwise cut off slow downloads
    update.timeout = None;
    update
        .download_and_install(|_, _| {}, || {})
        .await
        .map_err(|e| e.to_string())?;
    app.restart();
}

#[cfg(test)]
mod tests {
    use super::compare_versions;
    use std::cmp::Ordering::*;

    #[test]
    fn compares_dotted_versions() {
        assert_eq!(compare_versions("14.0", "13.5"), Some(Greater));
        assert_eq!(compare_versions("13.5", "13.5.0"), Some(Equal));
        assert_eq!(compare_versions("13.4.1", "13.5"), Some(Less));
        assert_eq!(compare_versions("10.0.19045", "10.0.22000"), Some(Less));
        assert_eq!(compare_versions("10.0.22631", "10.0.22000"), Some(Greater));
        assert_eq!(compare_versions("unknown", "13.5"), None);
    }
}
