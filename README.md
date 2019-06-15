# gnome_invert_windows
extension to invert windows in gnome. derived from maiself's work. currently specially good for gnome 32-.

# Features
* inverts windows automatically when created
* uninverts and uses xrandr-invert in overview mode to avoid bug with gnome 32- (fixed gnome 32 and +) see https://github.com/maiself/gnome-shell-extension-invert-color/issues/10
* can select between default shaders in settings
* can add custom shader to apply in dconf editor/gsettings
* application based whitelist and blacklist
* solid configurability in settings (gnome-tweaks / gnome shell extensions) and dconf

# Requirements
* xrandr-invert https://github.com/zoltanp/xrandr-invert-colors (for future releases this would be an option in settings) (currenlty still works without it though)

# Installation
* copy directory to /.local/share/gnome-shell/extensions
* enable extension in dconf

# Issues
* the xrandr-invert hack shows a noticable delay between un-inversion an inversion when opening or closing overview mode. this is solved by using gnome 32+ and the 32+ version of this extension.
* xrandr-invert sometimes mis-behaves and acts as if it has been called multiple times. restarting gnome (alt+F2 and entering r) should fix the issue.
