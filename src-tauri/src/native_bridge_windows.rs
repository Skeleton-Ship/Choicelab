use windows::{
    Win32::Foundation::HWND,
    Win32::UI::Controls::{
        TaskDialogIndirect, TASKDIALOGCONFIG, TASKDIALOG_BUTTON,
        TDF_ALLOW_DIALOG_CANCELLATION, TD_WARNING_ICON,
    },
    core::PCWSTR,
};

const BTN_SAVE: i32 = 100;
const BTN_DONT_SAVE: i32 = 101;
const BTN_CANCEL: i32 = 102;

fn to_wide_null(s: &str) -> Vec<u16> {
    s.encode_utf16().chain(std::iter::once(0)).collect()
}

/// Show the standard three-button unsaved-changes Task Dialog (Save / Don't Save / Cancel).
/// Returns "save", "dont_save", or "cancel".
/// Blocks the calling thread; call from a background thread.
pub fn show_unsaved_changes_dialog(title: &str, body: &str) -> &'static str {
    let title_w = to_wide_null(title);
    let body_w = to_wide_null(body);
    let save_w = to_wide_null("Save");
    let dont_save_w = to_wide_null("Don't Save");
    let cancel_w = to_wide_null("Cancel");

    let buttons = [
        TASKDIALOG_BUTTON {
            nButtonID: BTN_SAVE,
            pszButtonText: PCWSTR(save_w.as_ptr()),
        },
        TASKDIALOG_BUTTON {
            nButtonID: BTN_DONT_SAVE,
            pszButtonText: PCWSTR(dont_save_w.as_ptr()),
        },
        TASKDIALOG_BUTTON {
            nButtonID: BTN_CANCEL,
            pszButtonText: PCWSTR(cancel_w.as_ptr()),
        },
    ];

    let mut config = TASKDIALOGCONFIG {
        cbSize: std::mem::size_of::<TASKDIALOGCONFIG>() as u32,
        dwFlags: TDF_ALLOW_DIALOG_CANCELLATION,
        pszMainInstruction: PCWSTR(title_w.as_ptr()),
        pszContent: PCWSTR(body_w.as_ptr()),
        cButtons: buttons.len() as u32,
        pButtons: buttons.as_ptr(),
        nDefaultButton: BTN_SAVE,
        ..Default::default()
    };
    // Set the warning icon via the pszMainIcon union field (used when TDF_USE_HICON_MAIN is not set)
    // Set warning icon via pszMainIcon (used when TDF_USE_HICON_MAIN is not set)
    config.Anonymous1.pszMainIcon = TD_WARNING_ICON;
    // hwndParent left as null (default) — dialog appears centered on screen
    config.hwndParent = HWND::default();

    let mut button_id: i32 = BTN_CANCEL;
    unsafe {
        let _ = TaskDialogIndirect(&config, Some(&mut button_id), None, None);
    }

    match button_id {
        BTN_SAVE => "save",
        BTN_DONT_SAVE => "dont_save",
        _ => "cancel", // BTN_CANCEL or IDCANCEL (Escape / X button)
    }
}
