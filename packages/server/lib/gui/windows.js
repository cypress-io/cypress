/* eslint-disable
    brace-style,
    no-unused-vars,
    prefer-rest-params,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require('lodash')
const uri = require('url')
const Promise = require('bluebird')
const cyDesktop = require('@packages/desktop-gui')
const extension = require('@packages/extension')
const contextMenu = require('electron-context-menu')
const {
  BrowserWindow,
} = require('electron')
const debug = require('debug')('cypress:server:windows')
const cwd = require('../cwd')
const user = require('../user')
const savedState = require('../saved_state')

let windows = {}
let recentlyCreatedWindow = false

const getUrl = function (type) {
  switch (type) {
    case 'INDEX':
      return cyDesktop.getPathToIndex()
    default:
      throw new Error(`No acceptable window type found for: '${type}'`)
  }
}

const getByType = (type) => {
  return windows[type]
}

const getCookieUrl = (props) => {
  return extension.getCookieUrl(props)
}

const firstOrNull = (cookies) => // normalize into null when empty array
{
  return cookies[0] != null ? cookies[0] : null
}

const setWindowProxy = function (win) {
  if (!process.env.HTTP_PROXY) {
    return
  }

  return win.webContents.session.setProxy({
    proxyRules: process.env.HTTP_PROXY,
    proxyBypassRules: process.env.NO_PROXY,
  })
}

module.exports = {
  installExtension (path) {
    // extensions can only be installed for all BrowserWindows
    const name = BrowserWindow.addExtension(path)

    debug('electron extension installed %o', { success: !!name, name, path })

    if (!name) {
      throw new Error('Extension could not be installed.')
    }
  },

  removeAllExtensions () {
    const extensions = _.keys(BrowserWindow.getExtensions())

    debug('removing all electron extensions %o', extensions)

    return extensions.forEach(BrowserWindow.removeExtension)
  },

  reset () {
    windows = {}
  },

  destroy (type) {
    let win

    if (type && (win = getByType(type))) {
      return win.destroy()
    }
  },

  get (type) {
    return getByType(type) || (() => {
      throw new Error(`No window exists for: '${type}'`)
    })()
  },

  showAll () {
    return _.invoke(windows, 'showInactive')
  },

  hideAllUnlessAnotherWindowIsFocused () {
    // bail if we have another focused window
    // or we are in the middle of creating a new one
    if (BrowserWindow.getFocusedWindow() || recentlyCreatedWindow) {
      return
    }

    // else hide all windows
    return _.invoke(windows, 'hide')
  },

  focusMainWindow () {
    return getByType('INDEX').show()
  },

  getByWebContents (webContents) {
    return BrowserWindow.fromWebContents(webContents)
  },

  _newBrowserWindow (options) {
    return new BrowserWindow(options)
  },

  defaults (options = {}) {
    return _.defaultsDeep(options, {
      x: null,
      y: null,
      show: true,
      frame: true,
      width: null,
      height: null,
      minWidth: null,
      minHeight: null,
      devTools: false,
      trackState: false,
      contextMenu: false,
      recordFrameRate: null,
      // extension:       null ## TODO add these once we update electron
      // devToolsExtension: null ## since these API's were added in 1.7.6
      onFocus () {},
      onBlur () {},
      onClose () {},
      onCrashed () {},
      onNewWindow () {},
      webPreferences: {
        partition: null,
        webSecurity: true,
        nodeIntegration: false,
        backgroundThrottling: false,
      },
    })
  },

  create (projectRoot, options = {}) {
    let ts

    options = this.defaults(options)

    if (options.show === false) {
      options.frame = false
      options.webPreferences.offscreen = true
    }

    options.webPreferences.webSecurity = !!options.chromeWebSecurity

    if (options.partition) {
      options.webPreferences.partition = options.partition
    }

    const win = this._newBrowserWindow(options)

    win.on('blur', function () {
      return options.onBlur.apply(win, arguments)
    })

    win.on('focus', function () {
      return options.onFocus.apply(win, arguments)
    })

    win.once('closed', function () {
      win.removeAllListeners()

      return options.onClose.apply(win, arguments)
    })

    // the webview loses focus on navigation, so we
    // have to refocus it everytime top navigates in headless mode
    // https://github.com/cypress-io/cypress/issues/2190
    if (options.show === false) {
      win.webContents.on('did-start-loading', () => {
        if (!win.isDestroyed()) {
          return win.focusOnWebView()
        }
      })
    }

    win.webContents.on('crashed', function () {
      return options.onCrashed.apply(win, arguments)
    })

    win.webContents.on('new-window', function () {
      return options.onNewWindow.apply(win, arguments)
    })

    ts = options.trackState

    if (ts) {
      this.trackState(projectRoot, options.isTextTerminal, win, ts)
    }

    // open dev tools if they're true
    if (options.devTools) {
      // and possibly detach dev tools if true
      win.webContents.openDevTools()
    }

    if (options.contextMenu) {
      // adds context menu with copy, paste, inspect element, etc
      contextMenu({
        showInspectElement: true,
        window: win,
      })
    }

    return win
  },

  open (projectRoot, options = {}) {
    // if we already have a window open based
    // on that type then just show + focus it!
    let win

    win = getByType(options.type)

    if (win) {
      win.show()

      return Promise.resolve(win)
    }

    recentlyCreatedWindow = true

    _.defaults(options, {
      width: 600,
      height: 500,
      show: true,
      webPreferences: {
        preload: cwd('lib', 'ipc', 'ipc.js'),
      },
    })

    if (!options.url) {
      options.url = getUrl(options.type)
    }

    win = this.create(projectRoot, options)

    debug('creating electron window with options %o', options)

    windows[options.type] = win

    win.webContents.id = _.uniqueId('webContents')

    win.once('closed', () => // slice the window out of windows reference
    {
      return delete windows[options.type]
    })

    // enable our url to be a promise
    // and wait for this to be resolved
    return Promise.join(
      options.url,
      setWindowProxy(win),
    )
    .spread((url) => {
      // navigate the window here!
      win.loadURL(url)

      recentlyCreatedWindow = false
    }).thenReturn(win)
  },

  trackState (projectRoot, isTextTerminal, win, keys) {
    const isDestroyed = () => {
      return win.isDestroyed()
    }

    win.on('resize', _.debounce(() => {
      if (isDestroyed()) {
        return
      }

      const [width, height] = win.getSize()
      const [x, y] = win.getPosition()
      const newState = {}

      newState[keys.width] = width
      newState[keys.height] = height
      newState[keys.x] = x
      newState[keys.y] = y

      return savedState.create(projectRoot, isTextTerminal)
      .then((state) => {
        return state.set(newState)
      })
    }
    , 500))

    win.on('moved', _.debounce(() => {
      if (isDestroyed()) {
        return
      }

      const [x, y] = win.getPosition()
      const newState = {}

      newState[keys.x] = x
      newState[keys.y] = y

      return savedState.create(projectRoot, isTextTerminal)
      .then((state) => {
        return state.set(newState)
      })
    }
    , 500))

    win.webContents.on('devtools-opened', () => {
      const newState = {}

      newState[keys.devTools] = true

      return savedState.create(projectRoot, isTextTerminal)
      .then((state) => {
        return state.set(newState)
      })
    })

    return win.webContents.on('devtools-closed', () => {
      const newState = {}

      newState[keys.devTools] = false

      return savedState.create(projectRoot, isTextTerminal)
      .then((state) => {
        return state.set(newState)
      })
    })
  },

}
