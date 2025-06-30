use std::process::Command;

fn main() {
    // Tell Cargo to rerun build.rs if the Swift source changes:
    println!("cargo:rerun-if-changed=src/NativeBridge.swift");

    // Call swiftc to build your dylib or .a
    let status = Command::new("swiftc")
        .args(&[
            "-emit-library",
            "-o",
            "macos/libNativeBridge.a",
            "-emit-object",
            "src/NativeBridge.swift",
            "-module-name",
            "NativeBridge",
        ])
        .status()
        .expect("Failed to compile Swift library");

    if !status.success() {
        panic!("Swift compilation failed");
    }

    #[cfg(target_os = "macos")]
    {
        println!("cargo:rustc-link-search=macos");
        println!("cargo:rustc-link-lib=static=NativeBridge");
        println!("cargo:rustc-link-lib=framework=AppKit");
        println!("cargo:rustc-link-lib=framework=Cocoa");
    }
    tauri_build::build()
}
