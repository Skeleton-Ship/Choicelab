#import <Cocoa/Cocoa.h>

// Rust callbacks
void menu_release_notes_clicked(void);
void menu_acknowledgments_clicked(void);
void menu_license_clicked(void);

@interface NativeBridge : NSObject
+ (instancetype)sharedInstance;
+ (void)setDocumentEdited:(BOOL)edited windowTitle:(NSString *)windowTitle;
+ (void)addNativeMenus;
@end

@implementation NativeBridge

+ (instancetype)sharedInstance {
    static NativeBridge *instance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{ instance = [[NativeBridge alloc] init]; });
    return instance;
}

+ (void)setDocumentEdited:(BOOL)edited windowTitle:(NSString *)windowTitle {
    dispatch_async(dispatch_get_main_queue(), ^{
        for (NSWindow *window in [NSApp windows]) {
            if ([window.title isEqualToString:windowTitle]) {
                window.documentEdited = edited;
                return;
            }
        }
        NSLog(@"No window found with title %@ to mark as edited.", windowTitle);
    });
}

+ (void)addNativeMenus {
    dispatch_async(dispatch_get_main_queue(), ^{
        NSMenu *mainMenu = [NSApp mainMenu];
        if (!mainMenu) return;

        // Project menu: show "Add No-Match Stem" in place of "Add Branch Stem"
        // while Option is held. Tauri can't make alternate items itself.
        NSMenu *projectMenu = [[mainMenu itemWithTitle:@"Project"] submenu];
        NSMenuItem *addStemItem = [projectMenu itemWithTitle:@"Add Branch Stem"];
        NSMenuItem *addNoMatchItem = [projectMenu itemWithTitle:@"Add No-Match Stem"];
        if (addStemItem && addNoMatchItem &&
            [projectMenu indexOfItem:addNoMatchItem] == [projectMenu indexOfItem:addStemItem] + 1) {
            // Alternates must share a key equivalent and differ only by modifiers
            addStemItem.keyEquivalent = @"";
            addStemItem.keyEquivalentModifierMask = 0;
            addNoMatchItem.keyEquivalent = @"";
            addNoMatchItem.keyEquivalentModifierMask = NSEventModifierFlagOption;
            addNoMatchItem.alternate = YES;
        }

        // Help menu
        BOOL hasHelp = NO;
        for (NSMenuItem *item in [mainMenu itemArray]) {
            if ([item.title isEqualToString:@"Help"]) { hasHelp = YES; break; }
        }

        if (!hasHelp) {
            NSMenu *helpMenu = [[NSMenu alloc] initWithTitle:@"Help"];
            NSMenuItem *helpMenuItem = [[NSMenuItem alloc] init];
            helpMenuItem.title = @"Help";
            helpMenuItem.submenu = helpMenu;
            [NSApp setHelpMenu:helpMenu];

            NativeBridge *bridge = [NativeBridge sharedInstance];

            NSMenuItem *item;

            item = [[NSMenuItem alloc] initWithTitle:@"Choicelab Help" action:@selector(openHelp:) keyEquivalent:@""];
            item.target = bridge;
            [helpMenu addItem:item];

            item = [[NSMenuItem alloc] initWithTitle:@"Report Issue or Request Feature..." action:@selector(openWebsite:) keyEquivalent:@""];
            item.target = bridge;
            [helpMenu addItem:item];

            [helpMenu addItem:[NSMenuItem separatorItem]];

            item = [[NSMenuItem alloc] initWithTitle:@"Website" action:@selector(openChoicelabSite:) keyEquivalent:@""];
            item.target = bridge;
            [helpMenu addItem:item];

            item = [[NSMenuItem alloc] initWithTitle:@"License" action:@selector(showLicense:) keyEquivalent:@""];
            item.target = bridge;
            [helpMenu addItem:item];

            item = [[NSMenuItem alloc] initWithTitle:@"Release Notes" action:@selector(showReleaseNotes:) keyEquivalent:@""];
            item.target = bridge;
            [helpMenu addItem:item];

            item = [[NSMenuItem alloc] initWithTitle:@"GitHub Repository" action:@selector(openGitHubRepo:) keyEquivalent:@""];
            item.target = bridge;
            [helpMenu addItem:item];

            item = [[NSMenuItem alloc] initWithTitle:@"Acknowledgments" action:@selector(showAcknowledgments:) keyEquivalent:@""];
            item.target = bridge;
            [helpMenu addItem:item];

            [mainMenu addItem:helpMenuItem];
        }

        // Window menu
        BOOL hasWindow = NO;
        for (NSMenuItem *item in [mainMenu itemArray]) {
            if ([item.title isEqualToString:@"Window"]) { hasWindow = YES; break; }
        }

        if (!hasWindow) {
            NSMenu *windowMenu = [[NSMenu alloc] initWithTitle:@"Window"];
            NSMenuItem *windowMenuItem = [[NSMenuItem alloc] init];
            windowMenuItem.title = @"Window";
            windowMenuItem.submenu = windowMenu;

            [windowMenu addItemWithTitle:@"Minimize" action:@selector(performMiniaturize:) keyEquivalent:@"m"];
            [windowMenu addItemWithTitle:@"Zoom" action:@selector(performZoom:) keyEquivalent:@""];
            [windowMenu addItem:[NSMenuItem separatorItem]];
            [windowMenu addItemWithTitle:@"Bring All to Front" action:@selector(arrangeInFront:) keyEquivalent:@""];

            [NSApp setWindowsMenu:windowMenu];

            NSInteger helpIndex = NSNotFound;
            for (NSInteger i = 0; i < (NSInteger)[mainMenu itemArray].count; i++) {
                if ([[mainMenu itemArray][(NSUInteger)i].title isEqualToString:@"Help"]) {
                    helpIndex = i;
                    break;
                }
            }

            if (helpIndex != NSNotFound) {
                [mainMenu insertItem:windowMenuItem atIndex:helpIndex];
            } else {
                [mainMenu addItem:windowMenuItem];
            }
        }
    });
}

- (void)openHelp:(NSMenuItem *)sender {
    [[NSWorkspace sharedWorkspace] openURL:[NSURL URLWithString:@"https://choicelab.xyz/docs/"]];
}

- (void)openWebsite:(NSMenuItem *)sender {
    [[NSWorkspace sharedWorkspace] openURL:[NSURL URLWithString:@"https://github.com/Skeleton-Ship/Choicelab/issues"]];
}

- (void)openChoicelabSite:(NSMenuItem *)sender {
    [[NSWorkspace sharedWorkspace] openURL:[NSURL URLWithString:@"https://choicelab.xyz"]];
}

- (void)openGitHubRepo:(NSMenuItem *)sender {
    [[NSWorkspace sharedWorkspace] openURL:[NSURL URLWithString:@"https://github.com/Skeleton-Ship/Choicelab"]];
}

- (void)showLicense:(NSMenuItem *)sender {
    menu_license_clicked();
}

- (void)showReleaseNotes:(NSMenuItem *)sender {
    menu_release_notes_clicked();
}

- (void)showAcknowledgments:(NSMenuItem *)sender {
    menu_acknowledgments_clicked();
}

@end

// Shows a modal alert with the application icon. Must be called from a background
// thread; blocks until the user responds via dispatch_sync to the main queue.
// Returns YES if the first (OK) button was clicked, NO otherwise.
BOOL show_app_icon_dialog(
    const char *title,
    const char *body,
    const char *ok_label,
    const char *cancel_label
) {
    __block BOOL result = NO;
    dispatch_sync(dispatch_get_main_queue(), ^{
        NSAlert *alert = [[NSAlert alloc] init];
        alert.icon = [NSApp applicationIconImage];
        alert.messageText = [NSString stringWithUTF8String:title];
        if (body && strlen(body) > 0) {
            alert.informativeText = [NSString stringWithUTF8String:body];
        }
        [alert addButtonWithTitle:[NSString stringWithUTF8String:ok_label]];
        if (cancel_label && strlen(cancel_label) > 0) {
            [alert addButtonWithTitle:[NSString stringWithUTF8String:cancel_label]];
        }
        result = ([alert runModal] == NSAlertFirstButtonReturn);
    });
    return result;
}

// Shows the standard three-button unsaved-changes dialog with the app icon.
// Must be called from a background thread (uses dispatch_sync to the main queue).
// Button layout follows macOS HIG: Save (primary/blue), Don't Save, Cancel.
// Returns: 0 = Save, 1 = Don't Save, 2 = Cancel.
int8_t show_unsaved_changes_dialog_native(const char *title, const char *body) {
    __block int8_t result = 2; // default to Cancel
    dispatch_sync(dispatch_get_main_queue(), ^{
        NSAlert *alert = [[NSAlert alloc] init];
        alert.icon = [NSApp applicationIconImage];
        alert.messageText = [NSString stringWithUTF8String:title];
        if (body && strlen(body) > 0) {
            alert.informativeText = [NSString stringWithUTF8String:body];
        }
        [alert addButtonWithTitle:@"Save"];
        [alert addButtonWithTitle:@"Don’t Save"];
        [alert addButtonWithTitle:@"Cancel"];
        NSModalResponse response = [alert runModal];
        if (response == NSAlertFirstButtonReturn)       result = 0;
        else if (response == NSAlertSecondButtonReturn) result = 1;
        else                                            result = 2;
    });
    return result;
}

// Writes the display name of the volume containing `path` (as Finder shows it,
// e.g. "Macintosh HD") into `out` as UTF-8. `path` must exist. Returns NO if the
// name isn't available or doesn't fit. Safe to call from any thread.
BOOL get_volume_display_name(const char *path, char *out, size_t out_len) {
    BOOL ok = NO;
    @autoreleasepool {
        NSString *pathString = [NSString stringWithUTF8String:path];
        if (pathString) {
            NSURL *url = [NSURL fileURLWithPath:pathString];
            NSString *name = nil;
            if ([url getResourceValue:&name forKey:NSURLVolumeLocalizedNameKey error:nil] && name.length > 0) {
                ok = [name getCString:out maxLength:out_len encoding:NSUTF8StringEncoding];
            }
        }
    }
    return ok;
}

// Gap between the close button's bottom edge and the bottom of the title bar
// in a window styled like a project window (overlay title bar), in points.
// Tauri's traffic_light_position() measures from there, and the gap differs
// between macOS versions, so the app needs it to place the buttons in the
// same spot on all of them. Returns -1 if it can't be measured. Must be
// called on the main thread.
double get_window_button_bottom_gap(void) {
    double gap = -1;
    @autoreleasepool {
        NSWindowStyleMask style = NSWindowStyleMaskTitled | NSWindowStyleMaskClosable |
            NSWindowStyleMaskMiniaturizable | NSWindowStyleMaskResizable |
            NSWindowStyleMaskFullSizeContentView;
        // Never shown; only laid out so its title bar can be measured
        NSWindow *window = [[NSWindow alloc] initWithContentRect:NSMakeRect(0, 0, 1000, 700)
                                                       styleMask:style
                                                         backing:NSBackingStoreBuffered
                                                           defer:NO];
        window.releasedWhenClosed = NO;
        window.titlebarAppearsTransparent = YES;
        [window layoutIfNeeded];

        NSButton *close = [window standardWindowButton:NSWindowCloseButton];
        // The view Tauri resizes to move the buttons
        NSView *container = close.superview.superview;
        if (close && container) {
            NSRect closeInContainer = [close convertRect:close.bounds toView:container];
            gap = container.isFlipped
                ? NSHeight(container.bounds) - NSMaxY(closeInContainer)
                : NSMinY(closeInContainer);
        }
        [window release];
    }
    return gap;
}

// Moves the window's traffic lights to (x, y), the same way Tauri does for
// `traffic_light_position`. AppKit resets them on some changes (like
// `setDocumentEdited:`) that Tauri doesn't know to re-apply after.
// Must run on the main thread.
void set_window_button_position(void *ns_window, double x, double y) {
    NSWindow *window = (NSWindow *)ns_window;
    NSButton *close = [window standardWindowButton:NSWindowCloseButton];
    NSButton *miniaturize = [window standardWindowButton:NSWindowMiniaturizeButton];
    NSButton *zoom = [window standardWindowButton:NSWindowZoomButton];
    NSView *container = close.superview.superview;
    if (!close || !miniaturize || !zoom || !container) return;

    NSRect closeRect = close.frame;
    CGFloat titleBarHeight = NSHeight(closeRect) + y;
    NSRect titleBarRect = container.frame;
    titleBarRect.size.height = titleBarHeight;
    titleBarRect.origin.y = NSHeight(window.frame) - titleBarHeight;
    container.frame = titleBarRect;

    CGFloat spaceBetween = NSMinX(miniaturize.frame) - NSMinX(closeRect);
    NSArray<NSButton *> *buttons = @[close, miniaturize, zoom];
    for (NSUInteger i = 0; i < buttons.count; i++) {
        NSPoint origin = buttons[i].frame.origin;
        origin.x = x + i * spaceBetween;
        [buttons[i] setFrameOrigin:origin];
    }
}
