/* global imports log */

const Gtk = imports.gi.Gtk

// Extension specific
const Me = imports.misc.extensionUtils.getCurrentExtension()
const Convenience = Me.imports.convenience

function buildPrefsWidget () { // eslint-disable-line no-unused-vars
  const schema = Convenience.getSettings()

  // Text and descriptions
  const invertWindowShortcut = schema.settings_schema.get_key('invert-window-shortcut').get_summary()
  const invertWindowShortcutDescription = schema.settings_schema.get_key('invert-window-shortcut').get_description()
  const invertAllWindowsShortcut = schema.settings_schema.get_key('invert-all-windows-shortcut').get_summary()
  const invertAllWindowsShortcutDescription = schema.settings_schema.get_key('invert-all-windows-shortcut').get_description()
  const userShaderSources = schema.settings_schema.get_key('user-shader-sources').get_summary()
  const userShaderSourcesDescription = schema.settings_schema.get_key('user-shader-sources').get_description()
  const selectShaderSource = schema.settings_schema.get_key('select-shader-source').get_summary()
  const selectShaderSourceDescription = schema.settings_schema.get_key('select-shader-source').get_description()
  // Create children objects
  const widgets = [
    {
      type: 'Label',
      params: { label: `${invertWindowShortcut}: ` },
      tooltip: invertWindowShortcutDescription,
      align: Gtk.Align.END,
      attach: [0, 1, 1, 1]
    },
    {
      type: 'Entry',
      params: { text: schema.get_strv('invert-window-shortcut').toString()},
      tooltip: invertWindowShortcutDescription,
      align: Gtk.Align.START,
      attach: [1, 1, 1, 1],
      connect: {
        'changed': self => {
          schema.set_strv('invert-window-shortcut', self.text.split(','))
        }
      }
    },
    {
      type: 'Label',
      params: { label: `${invertAllWindowsShortcut}: ` },
      tooltip: invertWindowShortcutDescription,
      align: Gtk.Align.END,
      attach: [0, 2, 1, 1]
    },
    {
      type: 'Entry',
      params: {  text: schema.get_strv('invert-all-windows-shortcut').toString() },
      tooltip: invertAllWindowsShortcutDescription,
      align: Gtk.Align.START,
      attach: [1, 2, 1, 1],
      connect: {
        'changed': self => {
          schema.set_strv('invert-all-windows-shortcut', self.text.split(','))
        }
      }
    },
    {
      type: 'Label',
      params: { label: `${selectShaderSource}: ` },
      tooltip: selectShaderSourceDescription,
      align: Gtk.Align.END,
      attach: [0, 3, 1, 1]
    },
    {
      type: 'Entry',
      params: {text: schema.get_string('select-shader-source')},
      tooltip: selectShaderSourceDescription,
      align: Gtk.Align.START,
      attach: [1, 3, 1, 1],
      connect: {
        'changed': self => {
          schema.set_string('select-shader-source', self.text)
        }
      }
    },
    {
      type: 'Label',
      params: { label: `${userShaderSources}: ` },
      tooltip: userShaderSourcesDescription,
      align: Gtk.Align.END,
      attach: [0, 4, 1, 1]
    },
    {
      type: 'Entry',
      params: {  text: JSON.stringify(schema.get_value('user-shader-sources').deep_unpack())},
      tooltip: userShaderSourcesDescription,
      align: Gtk.Align.START,
      attach: [1, 4, 1, 1],
      connect: {
        'changed': self => {
          value = new imports.gi.GLib.Variant("a{ss}",self.text);
          if(value) {schema.set_value('user-shader-sources', value);}_/* can use JSON.parse('{' + self.text + '}'); if JSON is legal. maybe a security hole. but doesn't exit the scope of the extension space. can run anything an extension can do here. actaully needs stanition. can be set by any script using gsettings -> bad.*/
        }
      }
    },
    {
      type: 'Label',
      params: { label: 'change org.gnome.shell.extensions.invert-window.user-shader-sources in dconf-editor or gsettings to edit user-shader-sources.' },
      tooltip: "set current user shader sources",
      align: Gtk.Align.CENTER,
      attach: [0, 5, 2, 1]
    }
  ]

  // Perform side-effects
  const vbox = new Gtk.Grid({
    column_spacing: 20,
    row_spacing: 20,
    margin: 10
  })

  widgets.map(function createWidget ({ type, params, tooltip, align, attach, connect }) {
    const widget = new Gtk[type](params)

    // Set description
    widget.set_tooltip_text(tooltip)

    // Set alignment
    widget.set_halign(align)
    widget.set_hexpand(true)

    // Add event handler if exists
    if (connect) {
      Object.keys(connect).map(function performConnect (signal) {
        widget.connect(signal, () => connect[signal](widget))
      })
    }

    vbox.attach(widget, ...attach)
  })

  vbox.show_all()
  return vbox
}

function init () { // eslint-disable-line
  log('set up settings for invert-window: code adapted from night light slider');
}
