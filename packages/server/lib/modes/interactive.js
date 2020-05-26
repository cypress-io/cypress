const _ = require('lodash')
const os = require('os')
const EE = require('events')
const { app } = require('electron')
const image = require('electron').nativeImage
const Promise = require('bluebird')
const cyIcons = require('@cypress/icons')
const electronApp = require('../util/electron-app')
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

  getWindowArgs (state, options = {}) {
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
        return process.exit()
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

  run (options) {
    const waitForReady = () => {
      return new Promise((resolve, reject) => {
        return app.on('ready', resolve)
      })
    }

    electronApp.allowRendererProcessReuse()

    return Promise.any([
      waitForReady(),
      Promise.delay(500),
    ])
    .then(() => {
      return this.ready(options)
    })
  },
}
