const Main = imports.ui.main;
const Lang = imports.lang;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const Clutter = imports.gi.Clutter;
const ExtensionUtils = imports.misc.extensionUtils;

const Self = ExtensionUtils.getCurrentExtension();
const Convenience = Self.imports.convenience;

const GLib = imports.gi.GLib;
const schema = Convenience.getSettings();

const SHORTCUT = 'invert-window-shortcut';
const SHORTCUT_ALL = 'invert-all-windows-shortcut';
const USER_SHADER_SOURCES = schema.get_value('user-shader-sources').deep_unpack();
const SELECT_SHADER_SOURCE = schema.get_string('select-shader-source');

/* 0), general 1) very aggressive, 2) natural, 3) perfect */
/* put first because if the user shader source has the same proprty it will override*/
const default_shader_sources = {
	general: ' \
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
	aggressive: ' \
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
	natural: ' \
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
	perfect: ' \
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
	'
}
const shader_sources = Object.assign(default_shader_sources, USER_SHADER_SOURCES);

const InvertWindowEffect = new Lang.Class({
	Name: 'InvertWindowEffect',
	Extends: Clutter.ShaderEffect,

	_init: function(params) {
		this.parent(params);
		/* maybe log here to show that the SELECT_SHADER_SOURCE is invalid.
		but have to be read from journalctl to understand anyways
		so maybe not for the common user*/
		/* can also do some input verification ( if it is valid selector and valid source(it is a string since input is object)*/
		this.set_shader_source(shader_sources[SELECT_SHADER_SOURCE] !== "undefined" ? shader_sources[SELECT_SHADER_SOURCE] : shader_sources["perfect"]);
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
global.display.connect("window-created", (dis, win) => global.get_window_actors().forEach(function(actor) {
    let meta_window = actor.get_meta_window();
    if(meta_window == win){
        effect = new InvertWindowEffect();
        actor.add_effect_with_name('invert-color', effect);
        win.invert_window_tag = true;
    }
}))

InvertWindow.prototype = {
	toggle_effect: function() {
		global.get_window_actors().forEach(function(actor) {
			let meta_window = actor.get_meta_window();
			if(meta_window.has_focus()) {
				if(actor.get_effect('invert-color')) {
					actor.remove_effect_by_name('invert-color');
					delete meta_window._invert_window_tag;
				}
				else {
					let effect = new InvertWindowEffect();
					actor.add_effect_with_name('invert-color', effect);
					meta_window._invert_window_tag = true;
				}
			}
		}, this);
	},

	toggle_effect_all: function() {
		global.get_window_actors().forEach(function(actor) {
			let meta_window = actor.get_meta_window();
			if(meta_window.get_wm_class()) {
				if(actor.get_effect('invert-color')) {
					actor.remove_effect_by_name('invert-color');
					delete meta_window._invert_window_tag;
				}
				else {
					let effect = new InvertWindowEffect();
					actor.add_effect_with_name('invert-color', effect);
					meta_window._invert_window_tag = true;
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

		global.get_window_actors().forEach(function(actor) {
			let meta_window = actor.get_meta_window();
			if(meta_window.hasOwnProperty('_invert_window_tag')) {
				let effect = new InvertWindowEffect();
				actor.add_effect_with_name('invert-color', effect);
			}
		}, this);
	},

	disable: function() {
		Main.wm.removeKeybinding(SHORTCUT);

		global.get_window_actors().forEach(function(actor) {
			actor.remove_effect_by_name('invert-color');
		}, this);
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
