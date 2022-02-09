const _ = require('lodash')
const os = require('os')
const EE = require('events')
const { app } = require('electron')
const image = require('electron').nativeImage
const cyIcons = require('@cypress/icons')
const savedState = require('../saved_state')
const menu = require('../gui/menu')
const Events = require('../gui/events')
const Windows = require('../gui/windows')

const isDev = () => {
  return process.env['CYPRESS_INTERNAL_ENV'] === 'development'
}

module.exports = {
  isMac () {
    return os.platform() === 'darwin'
  },

  getWindowArgs (state) {
    const common = {
      backgroundColor: '#dfe2e4',
      width: state.appWidth || 800,
      height: state.appHeight || 550,
      minWidth: 458,
      minHeight: 400,
      x: state.appX,
      y: state.appY,
      type: 'INDEX',
      devTools: state.isAppDevToolsOpen,
      trackState: {
        width: 'appWidth',
        height: 'appHeight',
        x: 'appX',
        y: 'appY',
        devTools: 'isAppDevToolsOpen',
      },
      onBlur () {
        if (this.webContents.isDevToolsOpened()) {
          return
        }

        return Windows.hideAllUnlessAnotherWindowIsFocused()
      },
      onFocus () {
        // hide dev tools if in production and previously focused
        // window was the electron browser
        menu.set({ withDevTools: isDev() })

        return Windows.showAll()
      },
      onClose () {
        app.quit()
      },
    }

    return _.extend(common, this.platformArgs())
  },

  platformArgs () {
    const args = {
      darwin: {
        show: true,
        frame: true,
        transparent: false,
      },

      linux: {
        show: true,
        frame: true,
        transparent: false,
        icon: image.createFromPath(cyIcons.getPathToIcon('icon_128x128.png')),
      },
    }

    return args[os.platform()]
  },

  ready (options = {}) {
    const bus = new EE

    const { projectRoot } = options

    // TODO: potentially just pass an event emitter
    // instance here instead of callback functions
    menu.set({
      withDevTools: isDev(),
      onLogOutClicked () {
        return bus.emit('menu:item:clicked', 'log:out')
      },
    })

    return savedState.create(projectRoot, false)
    .then((state) => {
      return state.get()
    })
    .then((state) => {
      return Windows.open(projectRoot, this.getWindowArgs(state, options))
      .then((win) => {
        Events.start(_.extend({}, options, {
          onFocusTests () {
            return app.focus({ steal: true }) || win.focus()
          },
          os: os.platform(),
        }), bus)

        return win
      })
    })
  },

  async run (options) {
    await app.whenReady()

    return this.ready(options)
  },
}
