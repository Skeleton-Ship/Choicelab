#import <Cocoa/Cocoa.h>

// Rust callbacks
void menu_release_notes_clicked(void);
void menu_acknowledgments_clicked(void);

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

- (void)showReleaseNotes:(NSMenuItem *)sender {
    menu_release_notes_clicked();
}

- (void)showAcknowledgments:(NSMenuItem *)sender {
    menu_acknowledgments_clicked();
}

@end
