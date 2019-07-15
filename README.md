# gnome_invert_windows
extension to invert windows in gnome. derived from maiself's work.

# Features
* inverts windows automatically when created
* has the option to uninvert and use xrandr-invert-color in overview mode to avoid bug with gnome 32- (fixed gnome 32 and +) see [#10](https://github.com/maiself/gnome-shell-extension-invert-color/issues/10 "Issue 10")
* can select between default shaders in settings
* can add custom shader to apply in dconf editor/gsettings
* application based whitelist and blacklist
* solid configurability in settings (gnome-tweaks / gnome shell extensions) and dconf

# Optional Requirements
* [xrandr-invert-colors](https://github.com/zoltanp/xrandr-invert-colors) (to utilize xrandr to circumvent bug with gnome 32-. if the option is enabled, without it the extensions just disables in over-view mode.)

# Installation
* copy directory to /.local/share/gnome-shell/extensions
* enable extension in dconf
* + read your current enabled extensions by
    - dconf read /org/org/gnome/shell/enabled-extensions
    - gsettings get org.gnome.shell enabled-extensions
  + update using the following code

   ````bash
    a=`gsettings get org.gnome.shell enabled-extensions` && a="${a::-1} , 'invert-window@maiself']" && gsettings set org.gnome.shell enabled-extensions "$a"
    ````

# Issues
* the xrandr-invert hack shows a noticable delay between un-inversion an inversion when opening or closing overview mode. This is solved by using gnome 32+ and/or disabling/not having xrandr-invert-color along with this extension.
* xrandr-invert sometimes mis-behaves and acts as if it has been called multiple times. Restarting gnome (alt+F2 and entering r) should fix the issue.
* also there seems to be an issue with xrandr-invert-colors when the device recovers from sleep/suspend and maybe hibernate. This can be fixed by resetarting the extension/gnome (alt+F2 and entering r).
