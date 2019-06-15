# gnome_invert_windows
extension to invert windows in gnome. derived from maiself's work. currently specially good for gnome 32-.

# Features
* inverts windows automatically when created
* uninverts and uses xrandr-invert in overview mode to avoid bug with gnome 32- (fixed gnome 32 and +) see https://github.com/maiself/gnome-shell-extension-invert-color#10
* can select between default shaders in settings
* can add custom shader to apply in dconf editor/gsettings
* application based whitelist and blacklist
* solid configurability in settings (gnome-tweaks / gnome shell extensions) and dconf

# Requirements
* xrandr-invert https://github.com/zoltanp/xrandr-invert-colors (for future releases this would be an option in settings) (currenlty still works without it though)
