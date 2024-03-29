const Main = imports.ui.main;
const Lang = imports.lang;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const Clutter = imports.gi.Clutter;
const ExtensionUtils = imports.misc.extensionUtils;

const Util = imports.misc.util;//xrandr call
const Self = ExtensionUtils.getCurrentExtension();
const Convenience = Self.imports.convenience;

const GLib = imports.gi.GLib;
const schema = Convenience.getSettings();

const SHORTCUT = 'invert-window-shortcut';
const SHORTCUT_ALL = 'invert-all-windows-shortcut';
var USER_SHADER_SOURCES = schema.get_value('user-shader-sources').deep_unpack();
var SELECT_SHADER_SOURCE = schema.get_string('select-shader-source');

/* 0), general 1) very aggressive, 2) natural, 3) perfect */
/* put first because if the user shader source has the same proprty it will override*/
const default_shader_sources = {
	default_with_extension: ' \
		uniform sampler2D tex; \
		void main() { \
				vec4 color = texture2D(tex, cogl_tex_coord_in[0].st); \
				if(color.a > 0.0) { \
						color.rgb /= color.a; \
				} \
				color.rgb = (1 - color.rgb); \
				color.rgb *= color.a; \
				cogl_color_out = color * cogl_color_in; \
		} \
	',
	keep_colors_wbolster: ' \
		uniform sampler2D tex; \
		void main() { \
				vec4 color = texture2D(tex, cogl_tex_coord_in[0].st); \
				if(color.a > 0.0) { \
						color.rgb /= color.a; \
				} \
				float maxColor = max (color.r, max (color.g, color.b)); \
				float minColor = min (color.r, min (color.g, color.b)); \
				float lightness = (maxColor + minColor) / 2.0; \
				float delta = (1.0 - lightness) - lightness; \
				color.rgb = (color.rgb + delta); \
				color.rgb *= color.a; \
				cogl_color_out = color * cogl_color_in; \
		} \
	',
	saturate_color: ' \
		uniform sampler2D tex; \
		void main() { \
				vec4 color = texture2D(tex, cogl_tex_coord_in[0].st); \
				if(color.a > 0.0) { \
						color.rgb /= color.a; \
				} \
				float maxColor = max (color.r, max (color.g, color.b)); \
				float minColor = min (color.r, min (color.g, color.b)); \
				float lightness = (maxColor + minColor) / 2.0; \
				float delta = (1.0 - lightness) - lightness; \
				color.rgb = (color.rgb - delta); \
				color.rgb *= color.a; \
				cogl_color_out = color * cogl_color_in; \
		} \
	',
	keep_colors_log69: ' \
        uniform sampler2D tex; \
        void main() { \
            vec4 color = texture2D(tex, cogl_tex_coord_in[0].st); \
            if(color.a > 0.0) { \
                color.rgb /= color.a; \
            } \
            float lightness = (color.r + color.g + color.b) / 3.0; \
            float delta = (1.0 - lightness) - lightness; \
            color.rgb = (color.rgb + delta); \
            color.rgb *= color.a; \
            cogl_color_out = color * cogl_color_in; \
        } \
    ',
	contrast_iamjackg: ' \
			uniform sampler2D tex; \
			void main() { \
			      vec4 color = texture2D(tex, cogl_tex_coord_in[0].st); \
			      if(color.a > 0.0) { \
			              color.rgb /= color.a; \
			      } \
			      color.rgb = vec3(1.0, 1.0, 1.0) - color.rgb; \
			      color.rgb *= color.a; \
			      color.rgb += 0.1; \
			      color.rgb *= 0.8; \
			      cogl_color_out = color * cogl_color_in; \
			} \
		'
}

// used global variables declaration
var shader_sources = Object.assign(default_shader_sources, USER_SHADER_SOURCES);
schema.set_strv('all-user-shader-source-keys', Object.keys(shader_sources));
//schema.set_value('user-shader-sources', new imports.gi.GLib.Variant("a{ss}", USER_SHADER_SOURCES));

var utilize_xrandr = schema.get_boolean('utilize-xrandr');

var window_inversion_behavior = schema.get_boolean('window-inversion-behavior'); //true == blacklist, false = whitelist
var window_black_list = schema.get_strv('black-list').map((x) => x.toLowerCase());
var window_white_list = schema.get_strv('white-list').map((x) => x.toLowerCase());


var couple_menu_behavior = schema.get_boolean('couple-menu-behavior'); //true == link up with how the window is inverted
var menu_inversion_behavior = schema.get_boolean('menu-inversion-behavior'); //true == menublacklist, false = menu whitelist
var menu_black_list = schema.get_strv('menu-black-list').map((x) => x.toLowerCase());

var menu_white_list = schema.get_strv('menu-white-list').map((x) => x.toLowerCase());

function should_invert_menu(wm_class){
	//return true;
	var blacklistResult = !menu_black_list.includes(wm_class.toLowerCase()) && menu_inversion_behavior;
	var whitelistResult = menu_white_list.includes(wm_class.toLowerCase()) && !menu_inversion_behavior;
	return  blacklistResult || whitelistResult;
}

function should_invert(wm_class){
	//return true;
	var blacklistResult = !window_black_list.includes(wm_class.toLowerCase()) && window_inversion_behavior;
	var whitelistResult = window_white_list.includes(wm_class.toLowerCase()) && !window_inversion_behavior;
	return  blacklistResult || whitelistResult;
}

function should_not_toggle(wm_class){
	var blacklistResult = window_black_list.includes(wm_class.toLowerCase()) && window_inversion_behavior;
	var whitelistResult = window_white_list.includes(wm_class.toLowerCase()) && !window_inversion_behavior;
	return  blacklistResult || whitelistResult;
}

var pid_wm_class_pair = {
	insert: function(pid, wm_class){
		if(! this[pid]){
			this[pid] = [wm_class.toLowerCase(),1];
 		} else{
			if(wm_class){ //to not replace on m_class empy in case of menu windows and such and only have good pid,class pairs
				this[pid][0] = wm_class.toLowerCase();
			}
			this[pid][1] += 1;
		}
	},
	remove: function(pid, wm_class) {
		if (this[pid]) {
			this[pid][1] -= 1;
			if (this[pid][1] == 0){
				delete this[pid];
			}
		}
	},
	get: function(pid){
		var ret = undefined;
		if(this[pid]){ //to not replace on m_class empy in case of menu windows and such and only have good pid,class pairs
			 ret = this[pid][0];
		}
		return ret;
	}
}
var currently_inverted_windows = { //issues will arise if there are windows named add, get or remove because window_strings are added directly as childen of the object
	add: function(window_string){
			this[window_string] = true;
	},
	get: function(window_string){
		return this[window_string];
	},
	remove: function(window_string){
		delete this[window_string];
	}
}


global.get_window_actors().forEach(function(actor) {
	let meta_window = actor.get_meta_window();
	pid_wm_class_pair.insert(meta_window.get_pid(), meta_window.get_wm_class());
	actor.connect("destroy", (actor) => {
		let meta_window = actor.get_meta_window();
		pid_wm_class_pair.remove(meta_window.get_pid(), meta_window.get_wm_class());
	});
});

const InvertWindowEffect = new Lang.Class({
	Name: 'InvertWindowEffect',
	Extends: Clutter.ShaderEffect,

	_init: function(params) {

		/* maybe log here to show that the SELECT_SHADER_SOURCE is invalid.
		but have to be read from journalctl to understand anyways
		so maybe not for the common user*/
		/* can also do some input verification ( if it is valid selector and valid source(it is a string since input is object)*/
		this.parent(params);
		this.set_shader_source(shader_sources[SELECT_SHADER_SOURCE] !== undefined ? shader_sources[SELECT_SHADER_SOURCE] : shader_sources["keep_colors_wbolster"]);
		/*this.set_shader_source(shader_sources["perfect"]);*/
	},

	vfunc_paint_target: function() {
		this.set_uniform_value("tex", 0);
		this.parent();
	}
});

function InvertWindow() {
	this.settings = Convenience.getSettings();
}

// global.display.connect("window-created", (dis, win) => global.get_window_actors().forEach(function(actor) {
//     let meta_window = actor.get_meta_window();
//     if(meta_window == win){
//         effect = new InvertWindowEffect();
// 				actor.remove_effect_by_name('invert-color'); //just to clear
//         actor.add_effect_with_name('invert-color', effect);
//         win.invert_window_tag = true;
//     }
// }))
global.display.connect("window-created", (dis,win) => {
	let actor = win.get_compositor_private();
  let effect = new InvertWindowEffect();
	//actor.remove_effect_by_name('invert-color'); //just to clear
	let pid =  win.get_pid();
	let wm_class = pid_wm_class_pair.get(pid)? pid_wm_class_pair.get(pid): win.get_wm_class(); //look her to implmenet balkac and white list that doesent affec inner windows
	pid_wm_class_pair.insert(pid, wm_class);

	if(win.is_skip_taskbar()){ //i f menu (menus doesn't have a wm_class which is why we use pid_wm_class_pair)
		if(couple_menu_behavior){
			if(should_invert(wm_class)){ //should_invert_menu automatically handles whitelist and blacklist
				actor.add_effect_with_name('invert-color', effect);
				currently_inverted_windows.add(win.toString());
		  	win.invert_window_tag = true;
			}
		}
		else { //if decoupled
			if(should_invert_menu(wm_class)){ //should_invert_menu automatically handles whitelist and blacklist
				actor.add_effect_with_name('invert-color', effect);
				currently_inverted_windows.add(win.toString());
				win.invert_window_tag = true;
			}
		}
	}

	else if (should_invert(wm_class)){ //just for normal windows
		let overview_feature = (utilize_xrandr && Main.overview._shown); //true if utilizing xrandr in overview
		if(!overview_feature){
			actor.add_effect_with_name('invert-color', effect);
	  	win.invert_window_tag = true;
		}
		currently_inverted_windows.add(win.toString()); //if window should be inverted, it would re inverted regardless of overview featuer
	}
	global.log("toString: ", win.toString());
	global.log("transiet_for: ", win.get_transient_for());
	global.log("pid: ", win.get_pid());
	global.log("get_wm_class: ", win.get_wm_class_instance());
	global.log("is_skip_taskbar: ", win.is_skip_taskbar());
	global.log("layer: ", win.get_layer());
	global.log("role: ", win.get_role());
	global.log("get_window_type: ", win.get_window_type());
	global.log("application_id: ", win.get_gtk_application_id ());
	global.log("bus_name: ", win.get_gtk_unique_bus_name ());
	global.log("application_path: ", win.get_gtk_application_object_path ());
	global.log("window_path: ", win.get_gtk_window_object_path ());
	global.log("app_menu_path: ", win.get_gtk_app_menu_object_path ());
	global.log("menubar_path: ", win.get_gtk_menubar_object_path ());
})

InvertWindow.prototype = {
	restart_shader: function() {
		let should_restart = this.settings.get_boolean('restart-after-selector-change'); //don't need to keep state of should_restart
		if (!should_restart) return 0 ;
		global.get_window_actors().forEach(function(actor) {
			let meta_window = actor.get_meta_window();
			if(currently_inverted_windows.get(meta_window.toString())) { //user forced
					actor.remove_effect_by_name('invert-color');
					let effect = new InvertWindowEffect();
					actor.add_effect_with_name('invert-color', effect);
			}
		}, this);
	},
	restart_windows: function() {
		let should_restart = this.settings.get_boolean('restart-after-selector-change'); //don't need to keep state of should_restart
		if (!should_restart) return 0 ;
		global.get_window_actors().forEach(function(actor) {
			let meta_window = actor.get_meta_window();
			if (! meta_window.is_skip_taskbar()) { // don't change menus
				if(currently_inverted_windows.get(meta_window.toString())) { //user forced
						actor.remove_effect_by_name('invert-color');
						currently_inverted_windows.remove(meta_window.toString());
				}
				if(should_invert(meta_window.get_wm_class())) { //user forced
						let effect = new InvertWindowEffect();
						actor.add_effect_with_name('invert-color', effect);
						currently_inverted_windows.add(meta_window.toString());
				}
		}
		}, this);
	},

	restart_menus: function() {
		let should_restart = this.settings.get_boolean('restart-after-selector-change'); //don't need to keep state of should_restart
		if (!should_restart) return 0 ;
		global.get_window_actors().forEach(function(actor) {
			let meta_window = actor.get_meta_window();
			if (meta_window.is_skip_taskbar()) {// don't change windows
				if(currently_inverted_windows.get(meta_window.toString())) { //user forced
						actor.remove_effect_by_name('invert-color');
						currently_inverted_windows.remove(meta_window.toString());
				}
				if(should_invert_menu(meta_window.get_wm_class())) { //user forced
						let effect = new InvertWindowEffect();
						actor.add_effect_with_name('invert-color', effect);
						currently_inverted_windows.add(meta_window.toString());
				}
		}
		}, this);

	},
	oNrestartAfterChange: function() {
		this.restart_extension();
		this.restart_menus();
	},

	oNchangedShaderSourceSelector: function() {
		let new_SELECT_SHADER_SOURCE = this.settings.get_string('select-shader-source');
		if(new_SELECT_SHADER_SOURCE != SELECT_SHADER_SOURCE) { //update only if different
			SELECT_SHADER_SOURCE = new_SELECT_SHADER_SOURCE; //update shader so that restarting affects it
	    this.restart_shader();
		}
		SELECT_SHADER_SOURCE = new_SELECT_SHADER_SOURCE; //if should_restart is false we still update
	},
	oNchangedShaderSources: function() {
		USER_SHADER_SOURCES = this.settings.get_value('user-shader-sources').deep_unpack();
		shader_sources = Object.assign(default_shader_sources, USER_SHADER_SOURCES);
		schema.set_strv('all-user-shader-source-keys', Object.keys(shader_sources));
		//schema.set_value('user-shader-sources', new imports.gi.GLib.Variant("a{ss}", USER_SHADER_SOURCES));
	},
	oNchangedUtilizeXrandr: function() {
		utilize_xrandr = this.settings.get_boolean('utilize-xrandr');
	},


	oNchangedWindowInversionBehavior: function() {
		window_inversion_behavior = this.settings.get_boolean('window-inversion-behavior');
		this.restart_windows();
	},
	oNchangedWindowBlackList: function() {
		window_black_list = schema.get_strv('black-list').map((x) => x.toLowerCase());
		this.restart_windows();
	},
	oNchangedWindowWhiteList: function() {
	 	window_white_list = schema.get_strv('white-list').map((x) => x.toLowerCase());
		this.restart_windows();
	},


	oNchangedCoupleMenuBehavior: function() {
		couple_menu_behavior = this.settings.get_boolean('couple-menu-behavior');
		this.restart_menus();
	},
	oNchangedMenuInversionBehavior: function() {
		menu_inversion_behavior = this.settings.get_boolean('menu-inversion-behavior');
		this.restart_menus();
	},
	oNchangedMenuBlackList: function() {
		menu_black_list = schema.get_strv('menu-black-list').map((x) => x.toLowerCase());
		this.restart_menus();
	},
	oNchangedMenuWhiteList: function() {
		menu_white_list = schema.get_strv('menu-white-list').map((x) => x.toLowerCase());
		this.restart_menus();
	},




	spawn_xrandr: function() {
		Util.spawn(['/bin/bash', '-c', "xrandr-invert-colors"]);
	},

	toggle_effect: function() {
		global.get_window_actors().forEach(function(actor) {
			let meta_window = actor.get_meta_window();
			if(meta_window.has_focus()) { //user forced
				if(actor.get_effect('invert-color')) {
					actor.remove_effect_by_name('invert-color');
					delete meta_window._invert_window_tag;
					currently_inverted_windows.remove(meta_window.toString());
				}
				else {
					let effect = new InvertWindowEffect();
					actor.add_effect_with_name('invert-color', effect);
					meta_window._invert_window_tag = true;
					currently_inverted_windows.add(meta_window.toString());
				}
			}
		}, this);
	},

	toggle_effect_all: function() {
		// var k = "gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell --method org.gnome.Shell.Eval 'Main.lookingGlass.toggle();'";
		// var s = ['/bin/bash', '-c', k];
		// //var f = k.split(" ");
		// //Util.spawn(s.concat(f));
		// Util.spawn(s);
		global.get_window_actors().forEach(function(actor) {
			let meta_window = actor.get_meta_window();
			if(! should_not_toggle(meta_window.get_wm_class())) {//! user forced
				if(actor.get_effect('invert-color')) {
					actor.remove_effect_by_name('invert-color');
					delete meta_window._invert_window_tag;
					currently_inverted_windows.remove(meta_window.toString());
				}
				else {
					let effect = new InvertWindowEffect();
					actor.add_effect_with_name('invert-color', effect);
					meta_window._invert_window_tag = true;
					currently_inverted_windows.add(meta_window.toString());
				}
			}
		}, this);
	},

	enable: function() {
		Main.wm.addKeybinding(
			SHORTCUT,
			this.settings,
			Meta.KeyBindingFlags.NONE,
			Shell.ActionMode.NORMAL,
			Lang.bind(this, this.toggle_effect)
		);

		Main.wm.addKeybinding(
			SHORTCUT_ALL,
			this.settings,
			Meta.KeyBindingFlags.NONE,
			Shell.ActionMode.NORMAL,
			Lang.bind(this, this.toggle_effect_all)
		);

		this.bindChanges();
		global.get_window_actors().forEach(function(actor) {
			let meta_window = actor.get_meta_window();
			if(should_invert(meta_window.get_wm_class())) {
				let effect = new InvertWindowEffect();
				actor.add_effect_with_name('invert-color', effect);
				currently_inverted_windows.add(meta_window.toString());
				meta_window._invert_window_tag = true;
			}
			let pid =  meta_window.get_pid();
			let wm_class =  meta_window.get_wm_class();
			if(pid_wm_class_pair.get(pid) === undefined){
				pid_wm_class_pair.insert(pid, wm_class);
			}
		}, this);

	},

	add: function() {
		global.get_window_actors().forEach(function(actor) {
			let meta_window = actor.get_meta_window();
			if(currently_inverted_windows.get(meta_window.toString())) { //equivalent to should_invert(meta_window.get_wm_class()) if done right
					let effect = new InvertWindowEffect();
					actor.add_effect_with_name('invert-color', effect);
					meta_window._invert_window_tag = true;
			} else{
				actor.remove_effect_by_name('invert-color');
				delete meta_window._invert_window_tag;
			}
		}, this);
	},

	disable: function() {
		Main.wm.removeKeybinding(SHORTCUT);
		Main.wm.removeKeybinding(SHORTCUT_ALL);
		global.get_window_actors().forEach(function(actor) {
			let meta_window = actor.get_meta_window();
			actor.remove_effect_by_name('invert-color');
			delete meta_window._invert_window_tag;
		}, this);
	},

	remove: function() {
			global.get_window_actors().forEach(function(actor) {
				let meta_window = actor.get_meta_window();
				if(should_invert(meta_window.get_wm_class())) { //equivalent to currently_inverted_windows[meta_window.toString()] if done right
						actor.remove_effect_by_name('invert-color');
						delete meta_window._invert_window_tag;
				} else{
					let effect = new InvertWindowEffect();
					actor.add_effect_with_name('invert-color', effect);
					meta_window._invert_window_tag = true;
				}
			}, this);

		},


	bindChanges: function() {
		this.signalsHandler = new Convenience.GlobalSignalsHandler();
		this.signalsHandler.add([
					Main.overview,
					'showing',
					Lang.bind(this, function () {
							if (utilize_xrandr){
								this.spawn_xrandr();
								this.remove();
							}
					})
			],
			[
					Main.overview,
					'hiding',
					Lang.bind(this, function () {
							if (utilize_xrandr){this.spawn_xrandr(); this.add();}
					})
			]
		);
		this._signalsHandler = new Convenience.GlobalSignalsHandler();
		this._signalsHandler.addWithLabel("settings",
			[
					this.settings,
					'changed::restart-after-selector-change',
					Lang.bind(this, this.oNrestartAfterChange)
			],
			[
					this.settings,
					'changed::select-shader-source',
					Lang.bind(this, this.oNchangedShaderSourceSelector)
			],
			[
					this.settings,
					'changed::user-shader-sources',
					Lang.bind(this, this.oNchangedShaderSources)
			],
			[
					this.settings,
					'changed::utilize-xrandr',
					Lang.bind(this, this.oNchangedUtilizeXrandr)
			],



			[
					this.settings,
					'changed::window-inversion-behavior',
					Lang.bind(this, this.oNchangedWindowInversionBehavior)
			],
			[
					this.settings,
					'changed::black-list',
					Lang.bind(this, this.oNchangedWindowBlackList)
			],
			[
					this.settings,
					'changed::white-list',
					Lang.bind(this, this.oNchangedWindowWhiteList)
			],


			[
					this.settings,
					'changed::couple-menu-behavior',
					Lang.bind(this, this.oNchangedCoupleMenuBehavior)
			],
			[
					this.settings,
					'changed::menu-inversion-behavior',
					Lang.bind(this, this.oNchangedMenuInversionBehavior)
			],
			[
					this.settings,
					'changed::menu-black-list',
					Lang.bind(this, this.oNchangedMenuBlackList)
			],
			[
					this.settings,
					'changed::menu-white-list',
					Lang.bind(this, this.oNchangedMenuWhiteList)
			]
		);
	}
};

let invert_window;

function init() {
}

function enable() {
	invert_window = new InvertWindow();
	invert_window.enable();
}

function disable() {
	invert_window.disable();
	invert_window = null;
}
