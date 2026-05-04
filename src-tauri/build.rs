use std::fs;
use std::path::Path;
use std::process::Command;

fn main() {
    println!("cargo:rerun-if-changed=src/NativeBridge.m");

    if std::env::var("CARGO_CFG_TARGET_OS").unwrap() == "macos" {
        let obj = "macos/NativeBridge.o";
        let lib = "macos/libNativeBridge.a";

        fs::create_dir_all(Path::new("macos")).expect("Failed to create macos dir");

        let status = Command::new("clang")
            .args(&[
                "-x", "objective-c",
                "-mmacosx-version-min=13.0",
                "-c", "src/NativeBridge.m",
                "-o", obj,
            ])
            .status()
            .expect("Failed to compile NativeBridge.m");

        if !status.success() {
            panic!("Objective-C compilation failed");
        }

        fs::remove_file(lib).ok(); // remove stale archive to avoid format mismatch

        let status = Command::new("ar")
            .args(&["rcs", lib, obj])
            .status()
            .expect("Failed to create static library");

        if !status.success() {
            panic!("ar failed");
        }

        println!("cargo:rustc-link-search=macos");
        println!("cargo:rustc-link-lib=static=NativeBridge");
        println!("cargo:rustc-link-arg=-ObjC"); // retain ObjC classes from static libs
        println!("cargo:rustc-link-lib=framework=AppKit");
        println!("cargo:rustc-link-lib=framework=Cocoa");
    }

    tauri_build::build()
}
