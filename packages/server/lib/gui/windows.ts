import _ from 'lodash'
import Bluebird from 'bluebird'
import contextMenu from 'electron-context-menu'
import { BrowserWindow } from 'electron'
import Debug from 'debug'
import cwd from '../cwd'
import savedState from '../saved_state'
const cyDesktop = require('@packages/desktop-gui')

const debug = Debug('cypress:server:windows')

export type WindowOptions = Electron.BrowserWindowConstructorOptions & {
  type?: 'INDEX'
  url?: string
  devTools?: boolean
}

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

const setWindowProxy = function (win) {
  if (!process.env.HTTP_PROXY) {
    return
  }

  return win.webContents.session.setProxy({
    proxyRules: process.env.HTTP_PROXY,
    proxyBypassRules: process.env.NO_PROXY,
  })
}

export function installExtension (win: BrowserWindow, path) {
  return win.webContents.session.loadExtension(path)
  .then((data) => {
    debug('electron extension installed %o', { data, path })
  })
  .catch((err) => {
    debug('error installing electron extension %o', { err, path })
    throw err
  })
}

export function removeAllExtensions (win: BrowserWindow) {
  let extensions

  try {
    extensions = win.webContents.session.getAllExtensions()

    extensions.forEach(({ id }) => {
      win.webContents.session.removeExtension(id)
    })
  } catch (err) {
    debug('error removing all extensions %o', { err, extensions })
  }
}

export function reset () {
  windows = {}
}

export function destroy (type) {
  let win

  if (type && (win = getByType(type))) {
    return win.destroy()
  }
}

export function get (type) {
  return getByType(type) || (() => {
    throw new Error(`No window exists for: '${type}'`)
  })()
}

export function showAll () {
  return _.invoke(windows, 'showInactive')
}

export function hideAllUnlessAnotherWindowIsFocused () {
  // bail if we have another focused window
  // or we are in the middle of creating a new one
  if (BrowserWindow.getFocusedWindow() || recentlyCreatedWindow) {
    return
  }

  // else hide all windows
  return _.invoke(windows, 'hide')
}

export function focusMainWindow () {
  return getByType('INDEX').show()
}

export function getByWebContents (webContents) {
  return BrowserWindow.fromWebContents(webContents)
}

export function _newBrowserWindow (options) {
  return new BrowserWindow(options)
}

export function defaults (options = {}) {
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
    onFocus () {},
    onBlur () {},
    onClose () {},
    onCrashed () {},
    onNewWindow () {},
    webPreferences: {
      partition: null,
      webSecurity: true,
      nodeIntegration: false,
      // TODO: enable contextIsolation for Cypress browser (default in Electron 12)
      contextIsolation: false,
      backgroundThrottling: false,
    },
  })
}

export function create (projectRoot, _options: WindowOptions = {}, newBrowserWindow = _newBrowserWindow) {
  const options = defaults(_options)

  if (options.show === false) {
    options.frame = false
  }

  options.webPreferences.webSecurity = !!options.chromeWebSecurity

  if (options.partition) {
    options.webPreferences.partition = options.partition
  }

  const win = newBrowserWindow(options)

  win.on('blur', function (...args) {
    return options.onBlur.apply(win, args)
  })

  win.on('focus', function (...args) {
    return options.onFocus.apply(win, args)
  })

  win.once('closed', function (...args) {
    win.removeAllListeners()

    return options.onClose.apply(win, args)
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

  win.webContents.on('crashed', function (...args) {
    return options.onCrashed.apply(win, args)
  })

  win.webContents.on('new-window', function (...args) {
    return options.onNewWindow.apply(win, args)
  })

  if (options.trackState) {
    trackState(projectRoot, options.isTextTerminal, win, options.trackState)
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
}

// open desktop-gui BrowserWindow
export function open (projectRoot, options: WindowOptions = {}, newBrowserWindow = _newBrowserWindow) {
  // if we already have a window open based
  // on that type then just show + focus it!
  let win

  win = getByType(options.type)

  if (win) {
    win.show()

    return Bluebird.resolve(win)
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

  win = create(projectRoot, options, newBrowserWindow)

  debug('creating electron window with options %o', options)

  if (options.type) {
    windows[options.type] = win

    win.once('closed', () => {
      delete windows[options.type!]
    })
  }

  // enable our url to be a promise
  // and wait for this to be resolved
  return Bluebird.join(
    options.url,
    setWindowProxy(win),
  )
  .spread((url) => {
    // navigate the window here!
    win.loadURL(url)

    recentlyCreatedWindow = false
  }).thenReturn(win)
}

export function trackState (projectRoot, isTextTerminal, win, keys) {
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
}
