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
  const selectShaderSource = schema.settings_schema.get_key('select-shader-source').get_summary()
  const selectShaderSourceDescription = schema.settings_schema.get_key('select-shader-source').get_description()
  const allUserShaderSourceKeys = schema.settings_schema.get_key('all-user-shader-source-keys').get_summary()
  const allUserShaderSourceKeysDescription = schema.settings_schema.get_key('all-user-shader-source-keys').get_description()


  const restartAfterChange = schema.settings_schema.get_key('restart-after-selector-change').get_summary()
  const restartAfterChangeDescription = schema.settings_schema.get_key('restart-after-selector-change').get_description()


  const utilizeXrandr = schema.settings_schema.get_key('utilize-xrandr').get_summary()
  const utilizeXrandrDescription = schema.settings_schema.get_key('utilize-xrandr').get_description()


  const windowInversionBehavior = schema.settings_schema.get_key('window-inversion-behavior').get_summary()
  const windowInversionBehaviorDescription = schema.settings_schema.get_key('window-inversion-behavior').get_description()

  const blackList = schema.settings_schema.get_key('black-list').get_summary()
  const blackListDescription = schema.settings_schema.get_key('black-list').get_description()

  const whiteList = schema.settings_schema.get_key('white-list').get_summary()
  const whiteListDescription = schema.settings_schema.get_key('white-list').get_description()


  const coupleMenuBehavior = schema.settings_schema.get_key('couple-menu-behavior').get_summary()
  const coupleMenuBehaviorDescription = schema.settings_schema.get_key('couple-menu-behavior').get_description()

  const menuInversionBehavior = schema.settings_schema.get_key('menu-inversion-behavior').get_summary()
  const menuInversionBehaviorDescription = schema.settings_schema.get_key('menu-inversion-behavior').get_description()

  const menuBlackList = schema.settings_schema.get_key('menu-black-list').get_summary()
  const menuBlackListDescription = schema.settings_schema.get_key('menu-black-list').get_description()

  const menuWhiteList = schema.settings_schema.get_key('menu-white-list').get_summary()
  const menuWhiteListDescription = schema.settings_schema.get_key('menu-white-list').get_description()



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
      type: 'ComboBoxText',
      params: {},
      tooltip: allUserShaderSourceKeysDescription,
      align: Gtk.Align.START,
      attach: [1, 3, 1, 1],
      connect: {
        'changed': self => {
          schema.set_string('select-shader-source',self.get_active_text())
        }
      },
      insert: schema.get_strv('all-user-shader-source-keys'),
      active: schema.get_string('select-shader-source')
    },
    {
      type: 'Label',
      params: { label: `${restartAfterChange}: ` },
      tooltip: restartAfterChangeDescription,
      align: Gtk.Align.END,
      attach: [0, 4, 1, 1]
    },
    {
      type: 'ComboBoxText',
      params: {},
      tooltip: restartAfterChangeDescription,
      align: Gtk.Align.START,
      attach: [1, 4, 1, 1],
      connect: {
        'changed': self => {
          schema.set_boolean('restart-after-selector-change', self.get_active_text() == 'true')
        }
      },
      insert: ["true","false"],
      active: schema.get_boolean('restart-after-selector-change').toString()
    },
    {
      type: 'Label',
      params: { label: `${utilizeXrandr}: ` },
      tooltip: utilizeXrandrDescription,
      align: Gtk.Align.END,
      attach: [0, 5, 1, 1]
    },
    {
      type: 'ComboBoxText',
      params: {},
      tooltip: utilizeXrandrDescription,
      align: Gtk.Align.START,
      attach: [1, 5, 1, 1],
      connect: {
        'changed': self => {
          schema.set_boolean('utilize-xrandr', self.get_active_text() == 'true')
        }
      },
      insert: ["true","false"],
      active: schema.get_boolean('utilize-xrandr').toString()
    },
    {
      type: 'Label',
      params: { label: `${windowInversionBehavior}: ` },
      tooltip: windowInversionBehaviorDescription,
      align: Gtk.Align.END,
      attach: [0, 6, 1, 1]
    },
    {
      type: 'ComboBoxText',
      params: {},
      tooltip: windowInversionBehaviorDescription,
      align: Gtk.Align.START,
      attach: [1, 6, 1, 1],
      connect: {
        'changed': self => {
          schema.set_boolean('window-inversion-behavior', self.get_active_text() == 'window black list')
        }
      },
      insert: ["window black list","window white list"],
      active: schema.get_boolean('window-inversion-behavior') ? "window black list": "window white list"
    },
    {
      type: 'Label',
      params: { label: `${blackList}: ` },
      tooltip: blackListDescription,
      align: Gtk.Align.END,
      attach: [0, 7, 1, 1]
    },
    {
      type: 'Entry',
      params: {text: schema.get_strv('black-list').toString()},
      tooltip: blackListDescription,
      align: Gtk.Align.START,
      attach: [1, 7, 1, 1],
      connect: {
        'changed': self => {
          schema.set_strv('black-list', self.text.split(','))
        }
      }
    },
    {
      type: 'Label',
      params: { label: `${whiteList}: ` },
      tooltip: whiteListDescription,
      align: Gtk.Align.END,
      attach: [0, 8, 1, 1]
    },
    {
      type: 'Entry',
      params: {text: schema.get_strv('white-list').toString()},
      tooltip: whiteListDescription,
      align: Gtk.Align.START,
      attach: [1, 8, 1, 1],
      connect: {
        'changed': self => {
          schema.set_strv('white-list', self.text.split(','))
        }
      }
    },
    {
      type: 'Label',
      params: { label: `${coupleMenuBehavior}: ` },
      tooltip: coupleMenuBehaviorDescription,
      align: Gtk.Align.END,
      attach: [0, 9, 1, 1]
    },
    {
      type: 'ComboBoxText',
      params: {},
      tooltip: coupleMenuBehaviorDescription,
      align: Gtk.Align.START,
      attach: [1, 9, 1, 1],
      connect: {
        'changed': self => {
          schema.set_boolean('couple-menu-behavior', self.get_active_text() == 'true')
        }
      },
      insert: ["true","false"],
      active: schema.get_boolean('couple-menu-behavior').toString()
    },
    {
      type: 'Label',
      params: { label: `${menuInversionBehavior}: ` },
      tooltip: menuInversionBehaviorDescription,
      align: Gtk.Align.END,
      attach: [0, 10, 1, 1]
    },
    {
      type: 'ComboBoxText',
      params: {},
      tooltip: menuInversionBehaviorDescription,
      align: Gtk.Align.START,
      attach: [1, 10, 1, 1],
      connect: {
        'changed': self => {
          schema.set_boolean('menu-inversion-behavior', self.get_active_text() == 'menu black list')
        }
      },
      insert: ["menu black list","menu white list"],
      active: schema.get_boolean('menu-inversion-behavior') ? "menu black list":  "menu white list"
    },
    {
      type: 'Label',
      params: { label: `${menuBlackList}: ` },
      tooltip: menuBlackListDescription,
      align: Gtk.Align.END,
      attach: [0, 11, 1, 1]
    },
    {
      type: 'Entry',
      params: {text: schema.get_strv('menu-black-list').toString()},
      tooltip: menuBlackListDescription,
      align: Gtk.Align.START,
      attach: [1, 11, 1, 1],
      connect: {
        'changed': self => {
          schema.set_strv('menu-black-list', self.text.split(','))
        }
      }
    },
    {
      type: 'Label',
      params: { label: `${menuWhiteList}: ` },
      tooltip: menuWhiteListDescription,
      align: Gtk.Align.END,
      attach: [0, 12, 1, 1]
    },
    {
      type: 'Entry',
      params: {text: schema.get_strv('menu-white-list').toString()},
      tooltip: menuWhiteListDescription,
      align: Gtk.Align.START,
      attach: [1, 12, 1, 1],
      connect: {
        'changed': self => {
          schema.set_strv('menu-white-list', self.text.split(','))
        }
      }
    },
    {
      type: 'Label',
      params: { label: 'change org.gnome.shell.extensions.invert-window.user-shader-sources in dconf-editor or gsettings to edit user-shader-sources.' },
      tooltip: "set current user shader sources",
      align: Gtk.Align.CENTER,
      attach: [0, 13, 2, 1]
    }
  ]

  // Perform side-effects
  const vbox = new Gtk.Grid({
    column_spacing: 20,
    row_spacing: 20,
    margin: 10
  })

  widgets.map(function createWidget ({ type, params, tooltip, align, attach, connect, insert, active }) {
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
    if (insert){
      insert.forEach((entry) => widget.append_text(entry))
      if (active){
        widget.set_active(insert.indexOf(active))
      }
    }

    vbox.attach(widget, ...attach)
  })

  vbox.show_all()
  return vbox
}

function init () { // eslint-disable-line
  log('set up settings for invert-window: code adapted from night light slider');
}
