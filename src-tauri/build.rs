use std::process::Command;

fn main() {
    println!("cargo:rerun-if-changed=src/NativeBridge.m");

    if std::env::var("CARGO_CFG_TARGET_OS").unwrap() == "macos" {
        let out_dir = std::env::var("OUT_DIR").unwrap();
        let obj = format!("{}/NativeBridge.o", out_dir);
        let lib = format!("{}/libNativeBridge.a", out_dir);

        let arch = match std::env::var("CARGO_CFG_TARGET_ARCH").unwrap().as_str() {
            "x86_64" => "x86_64",
            _ => "arm64",
        };

        let status = Command::new("clang")
            .args(&[
                "-x", "objective-c",
                "-arch", arch,
                "-mmacosx-version-min=13.0",
                "-c", "src/NativeBridge.m",
                "-o", &obj,
            ])
            .status()
            .expect("Failed to compile NativeBridge.m");

        if !status.success() {
            panic!("Objective-C compilation failed");
        }

        std::fs::remove_file(&lib).ok(); // remove stale archive to avoid format mismatch

        let status = Command::new("ar")
            .args(&["rcs", &lib, &obj])
            .status()
            .expect("Failed to create static library");

        if !status.success() {
            panic!("ar failed");
        }

        println!("cargo:rustc-link-search={}", out_dir);
        println!("cargo:rustc-link-lib=static=NativeBridge");
        println!("cargo:rustc-link-arg=-ObjC"); // retain ObjC classes from static libs
        println!("cargo:rustc-link-lib=framework=AppKit");
        println!("cargo:rustc-link-lib=framework=Cocoa");
    }

    tauri_build::build()
}
