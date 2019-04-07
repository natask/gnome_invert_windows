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

var shader_sources = Object.assign(default_shader_sources, USER_SHADER_SOURCES);
schema.set_strv('all-user-shader-source-keys', Object.keys(shader_sources));
//schema.set_value('user-shader-sources', new imports.gi.GLib.Variant("a{ss}", USER_SHADER_SOURCES));
var black_list = ["atom".toLowerCase()]
var white_list = [""]

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
var currently_inverted_windows = {
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
	let wm_class =  win.get_wm_class();
	if(! black_list.includes(pid_wm_class_pair[pid])){
  	actor.add_effect_with_name('invert-color', effect);
		currently_inverted_windows.add(win.toString());
  	win.invert_window_tag = true;
	}
	pid_wm_class_pair.insert(pid, wm_class);
	// global.log(win.get_transient_for());
	// global.log(win.get_pid());
	// global.log(win.get_wm_class_instance());
	// global.log(win.is_skip_taskbar());
	// global.log(win.get_layer());
	// global.log(win.get_role());
	// global.log(win.get_window_type());
	// global.log(win.get_gtk_application_id ());
	// global.log(win.get_gtk_unique_bus_name ());
	// global.log(win.get_gtk_application_object_path ());
	// global.log(win.get_gtk_window_object_path ());
	// global.log(win.get_gtk_app_menu_object_path ());
	// global.log(win.get_gtk_menubar_object_path ());
})

InvertWindow.prototype = {
	oNchangedShaderSourceSelector: function() {
		SELECT_SHADER_SOURCE = this.settings.get_string('select-shader-source');
	},
	oNchangedShaderSources: function() {
		USER_SHADER_SOURCES = this.settings.get_value('user-shader-sources').deep_unpack();
		shader_sources = Object.assign(default_shader_sources, USER_SHADER_SOURCES);
		schema.set_strv('all-user-shader-source-keys', Object.keys(shader_sources));
		//schema.set_value('user-shader-sources', new imports.gi.GLib.Variant("a{ss}", USER_SHADER_SOURCES));
	},
	spawn_xrandr: function() {
		Util.spawn(['/bin/bash', '-c', "xrandr-invert-colors"]);
	},

	toggle_effect: function() {
		global.get_window_actors().forEach(function(actor) {
			let meta_window = actor.get_meta_window();
			if(meta_window.has_focus()) {
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
			if(meta_window.get_wm_class()) {
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
			if(meta_window.hasOwnProperty('_invert_window_tag')) {
				let effect = new InvertWindowEffect();
				actor.add_effect_with_name('invert-color', effect);
				currently_inverted_windows.add(meta_window.toString());
				meta_window._invert_window_tag = true;
			}
		}, this);

	},

	add: function() {
		global.get_window_actors().forEach(function(actor) {
			let meta_window = actor.get_meta_window();
			if(currently_inverted_windows[meta_window.toString()]) {
					let effect = new InvertWindowEffect();
					actor.add_effect_with_name('invert-color', effect);
					meta_window._invert_window_tag = true;
			}
		}, this);
	},

	disable: function() {
		Main.wm.removeKeybinding(SHORTCUT);
		Main.wm.removeKeybinding(SHORTCUT_ALL);
		global.get_window_actors().forEach(function(actor) {
			actor.remove_effect_by_name('invert-color');
			delete meta_window._invert_window_tag;
		}, this);
	},

	remove: function() {
			global.get_window_actors().forEach(function(actor) {
				let meta_window = actor.get_meta_window();
				if(meta_window.get_wm_class()) {
						actor.remove_effect_by_name('invert-color');
						delete meta_window._invert_window_tag;
				}
			}, this);

		},


	bindChanges: function() {
		this.signalsHandler = new Convenience.GlobalSignalsHandler();
		this.signalsHandler.add([
					Main.overview,
					'showing',
					Lang.bind(this, function () {
							this.spawn_xrandr(); this.remove();
					})
			],
			[
					Main.overview,
					'hiding',
					Lang.bind(this, function () {
							this.spawn_xrandr(); this.add();
					})
			]
		);
		this._signalsHandler = new Convenience.GlobalSignalsHandler();
		this._signalsHandler.addWithLabel("settings",
			[
					this.settings,
					'changed::select-shader-source',
					Lang.bind(this, this.oNchangedShaderSourceSelector)
			],
			[
					this.settings,
					'changed::user-shader-sources',
					Lang.bind(this, this.oNchangedShaderSources)
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
