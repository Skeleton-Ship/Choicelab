import Cocoa

@objc public class NativeMenusBridge: NSObject {
@objc public static func addNativeMenus() {
	DispatchQueue.main.async {
		guard let mainMenu = NSApp.mainMenu else { return }

		if mainMenu.items.contains(where: { $0.title == "Help" }) {
			return
		}

		let helpMenu = NSMenu(title: "Help")
		let helpMenuItem = NSMenuItem()
		helpMenuItem.title = "Help"
		helpMenuItem.submenu = helpMenu

		// Mark this as the official Help menu
		NSApp.helpMenu = helpMenu

   let visitWebsiteItem = NSMenuItem(
			title: "Report a Problem or Request Feature...",
			action: #selector(openWebsite(_:)),
			keyEquivalent: ""
		  )
		  visitWebsiteItem.target = NativeMenusBridge.sharedInstance()
		  helpMenu.addItem(visitWebsiteItem)
		  
		  mainMenu.addItem(helpMenuItem)
	}
}

  // Create a singleton so the selector has a target instance
  @objc public static func sharedInstance() -> NativeMenusBridge {
	return _sharedInstance
  }
  private static let _sharedInstance = NativeMenusBridge()
  
  @objc func openWebsite(_ sender: NSMenuItem) {
	if let url = URL(string: "https://docs.google.com/forms/d/e/1FAIpQLSdXVX91Ze0jAmu9FOaqEvMv-VxYFPYOeQVcuQt9YdShwSSXKQ/viewform?usp=sf_link") {
	  NSWorkspace.shared.open(url)
	}
  }
  
}
