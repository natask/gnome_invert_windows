#!/usr/bin/gjs

//This script is only to test on non supported gnome shell version
//or to help in debuging

const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;
const mainloop = imports.mainloop;

//const Main = imports.ui.main;
const Meta = imports.gi.Meta;
//const Shell = imports.gi.Shell;
const Lang = imports.lang;
const Clutter = imports.gi.Clutter;


//OK
Gtk.init(null, null);
//NO
//Gdk.init(ARGV);

print("Hello World!");

GLib.timeout_add_seconds(0, 1, function () {
    let act = global.get_window_actors();
    print(""+act.toString());
    print("" + act);
    print(act);
    return true;
    });

//OK
//Gtk.main();
//OK
mainloop.run();
