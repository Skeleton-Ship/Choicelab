//! The display name of the disk a path is on, as the OS's file browser shows
//! it ("Macintosh HD" in Finder, "Local Disk (C:)" in Explorer). Used to name
//! the disk in error messages. Needs no extra permissions: it only queries a
//! volume the app is already writing to.

use std::path::Path;

/// The display name of the disk `path` is on. `path` doesn't need to exist;
/// its nearest existing parent folder is used.
pub fn volume_display_name(path: &Path) -> Option<String> {
    let existing = path.ancestors().find(|p| p.exists())?;
    platform_volume_display_name(existing)
}

#[cfg(target_os = "macos")]
fn platform_volume_display_name(path: &Path) -> Option<String> {
    use std::ffi::{c_char, CStr, CString};
    extern "C" {
        fn get_volume_display_name(path: *const c_char, out: *mut c_char, out_len: usize) -> i8;
    }
    let path = CString::new(path.to_str()?).ok()?;
    let mut buffer = [0 as c_char; 1024];
    let ok = unsafe { get_volume_display_name(path.as_ptr(), buffer.as_mut_ptr(), buffer.len()) };
    if ok == 0 {
        return None;
    }
    let name = unsafe { CStr::from_ptr(buffer.as_ptr()) };
    name.to_str().ok().map(|s| s.to_string())
}

#[cfg(target_os = "windows")]
fn platform_volume_display_name(path: &Path) -> Option<String> {
    use std::os::windows::ffi::OsStrExt;
    use windows::core::PCWSTR;
    use windows::Win32::Storage::FileSystem::{GetVolumePathNameW, FILE_FLAGS_AND_ATTRIBUTES};
    use windows::Win32::UI::Shell::{SHGetFileInfoW, SHFILEINFOW, SHGFI_DISPLAYNAME};

    let wide: Vec<u16> = path.as_os_str().encode_wide().chain(std::iter::once(0)).collect();
    // The root of the volume, e.g. "C:\" (or a folder, for drives mounted in one)
    let mut root = [0u16; 261];
    unsafe { GetVolumePathNameW(PCWSTR(wide.as_ptr()), &mut root) }.ok()?;
    // Explorer's name for it, e.g. "Local Disk (C:)". Microsoft recommends
    // calling this off the UI thread; callers run on a background thread.
    let mut info = SHFILEINFOW::default();
    let result = unsafe {
        SHGetFileInfoW(
            PCWSTR(root.as_ptr()),
            FILE_FLAGS_AND_ATTRIBUTES(0),
            Some(&mut info),
            std::mem::size_of::<SHFILEINFOW>() as u32,
            SHGFI_DISPLAYNAME,
        )
    };
    if result == 0 {
        return None;
    }
    let name = &info.szDisplayName;
    let len = name.iter().position(|&c| c == 0).unwrap_or(name.len());
    String::from_utf16(&name[..len]).ok().filter(|s| !s.is_empty())
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
fn platform_volume_display_name(_path: &Path) -> Option<String> {
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[cfg(any(target_os = "macos", target_os = "windows"))]
    #[test]
    fn names_the_disk_for_a_path_that_does_not_exist_yet() {
        let path = std::env::temp_dir().join("choicelab-missing-folder/nested");
        let name = volume_display_name(&path);
        assert!(name.as_deref().is_some_and(|n| !n.is_empty()), "got {:?}", name);
        println!("Volume name: {:?}", name);
    }
}
