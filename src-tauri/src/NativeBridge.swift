import Cocoa

@objc public class NativeBridge: NSObject {
	
@objc public static func setDocumentEdited(_ edited: Bool, windowTitle: String) {
    DispatchQueue.main.async {
        // Find the window with the matching title
        if let targetWindow = NSApp.windows.first(where: { $0.title == windowTitle }) {
            targetWindow.isDocumentEdited = edited
        } else {
            print("No window found with title \(windowTitle) to mark as edited.")
        }
    }
}
	  
  @objc public static func addNativeMenus() {
	DispatchQueue.main.async {
	  guard let mainMenu = NSApp.mainMenu else { return }

	  // Avoid duplicating Help menu
	  if mainMenu.items.contains(where: { $0.title == "Help" }) == false {
		// --- Help Menu ---
		let helpMenu = NSMenu(title: "Help")
		let helpMenuItem = NSMenuItem()
		helpMenuItem.title = "Help"
		helpMenuItem.submenu = helpMenu
		
		// Mark as official Help menu
		NSApp.helpMenu = helpMenu

		let visitWebsiteItem = NSMenuItem(
		  title: "Report Issue or Request Feature...",
		  action: #selector(openWebsite(_:)),
		  keyEquivalent: ""
		)
		visitWebsiteItem.target = NativeBridge.sharedInstance()
		helpMenu.addItem(visitWebsiteItem)

		let releaseNotesItem = NSMenuItem(
		  title: "Release Notes",
		  action: #selector(showReleaseNotes(_:)),
		  keyEquivalent: ""
		)
		releaseNotesItem.target = NativeBridge.sharedInstance()
		helpMenu.addItem(releaseNotesItem)
		
		mainMenu.addItem(helpMenuItem)
	  }

	  // Avoid duplicating Window menu
	  if mainMenu.items.contains(where: { $0.title == "Window" }) == false {
		// --- Window Menu ---
		let windowMenu = NSMenu(title: "Window")
		let windowMenuItem = NSMenuItem()
		windowMenuItem.title = "Window"
		windowMenuItem.submenu = windowMenu
		
		// Standard Window menu items with macOS selectors
		windowMenu.addItem(
		  withTitle: "Minimize",
		  action: #selector(NSWindow.performMiniaturize(_:)),
		  keyEquivalent: "m"
		)
		windowMenu.addItem(
		  withTitle: "Zoom",
		  action: #selector(NSWindow.performZoom(_:)),
		  keyEquivalent: ""
		)
		windowMenu.addItem(NSMenuItem.separator())
		windowMenu.addItem(
		  withTitle: "Bring All to Front",
		  action: #selector(NSApplication.arrangeInFront(_:)),
		  keyEquivalent: ""
		)
		
		// Assign Window menu so macOS manages window list here
		NSApp.windowsMenu = windowMenu

		// Insert Window menu usually before Help menu if present, else at end
		if let helpIndex = mainMenu.items.firstIndex(where: { $0.title == "Help" }) {
		  mainMenu.insertItem(windowMenuItem, at: helpIndex)
		} else {
		  mainMenu.addItem(windowMenuItem)
		}
	  }
	}
  }

  // Singleton instance for target of selectors
  @objc public static func sharedInstance() -> NativeBridge {
	return _sharedInstance
  }
  private static let _sharedInstance = NativeBridge()

  @objc func openWebsite(_ sender: NSMenuItem) {
	if let url = URL(string: "https://docs.google.com/forms/d/e/1FAIpQLSdXVX91Ze0jAmu9FOaqEvMv-VxYFPYOeQVcuQt9YdShwSSXKQ/viewform?usp=sf_link") {
	  NSWorkspace.shared.open(url)
	}
  }

  // Add C function declaration for Rust callback
  @_silgen_name("menu_release_notes_clicked")
  func menu_release_notes_clicked()

  @objc func showReleaseNotes(_ sender: NSMenuItem) {
    // Call into Rust
    menu_release_notes_clicked()
  }
}
