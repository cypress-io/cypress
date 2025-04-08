import _ from 'lodash'
import Bluebird from 'bluebird'
// tslint:disable-next-line no-implicit-dependencies - electron dep needs to be defined
import { BrowserWindow } from 'electron'
import Debug from 'debug'
import * as savedState from '../saved_state'

const debug = Debug('cypress:server:windows')

export type WindowOptions = Electron.BrowserWindowConstructorOptions & {
  type?: 'INDEX'
  devTools?: boolean
  graphqlPort?: number
  contextMenu?: boolean
  partition?: string
  /**
   * Synchronizes properties of browserwindow with local state
   */
  trackState?: TrackStateMap
  onFocus?: () => void
  onNewWindow?: ({ disposition, features, frameName, postBody, referrer, url }) => Promise<void>
  onCrashed?: () => void
}

export type WindowOpenOptions = WindowOptions & { url: string }

type TrackStateMap = Record<'width' | 'height' | 'x' | 'y' | 'devTools', string>

let windows = {}
let recentlyCreatedWindow = false

const getByType = (type: string) => {
  return windows[type]
}

const setWindowProxy = function (win: BrowserWindow) {
  if (!process.env.HTTP_PROXY) {
    return
  }

  return win.webContents.session.setProxy({
    proxyRules: process.env.HTTP_PROXY,
    proxyBypassRules: process.env.NO_PROXY,
  })
}

export function installExtension (win: BrowserWindow, path: string) {
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

export function destroy (type: string) {
  let win

  if (type && (win = getByType(type))) {
    return win.destroy()
  }
}

export function get (type: string) {
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

export function isMainWindowFocused () {
  return getByType('INDEX').isFocused()
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
      backgroundThrottling: false,
    },
  })
}

export function create (projectRoot, _options: WindowOptions, newBrowserWindow = _newBrowserWindow) {
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

  win.webContents.on('render-process-gone', function (...args) {
    return options.onCrashed.apply(win, args)
  })

  // As of Electron v22, the 'new-window' event has been removed for 'setWindowOpenHandler'.
  // @see https://github.com/electron/electron/blob/v21.0.0/docs/api/web-contents.md#event-new-window-deprecated
  // @see https://github.com/electron/electron/pull/34526
  win.webContents.setWindowOpenHandler(function (...args) {
    // opens the child window from the root window so Cypress can decorate it with needed events and configuration
    options.onNewWindow.apply(win, args)

    // Because the opening of the window is handled by the root window above, deny opening the window.
    // @see https://github.com/electron/electron/blob/v21.0.0/docs/api/web-contents.md#contentssetwindowopenhandlerhandler
    return { action: 'deny' }
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
    require('electron-context-menu')({
      showInspectElement: true,
      window: win,
    })
  }

  return win
}

// open launchpad BrowserWindow
export async function open (projectRoot: string, options: WindowOpenOptions, newBrowserWindow = _newBrowserWindow): Promise<BrowserWindow> {
  // if we already have a window open based
  // on that type then just show + focus it!
  const knownWin = options.type && getByType(options.type)

  if (knownWin) {
    knownWin.show()

    return Bluebird.resolve(knownWin)
  }

  recentlyCreatedWindow = true

  _.defaults(options, {
    width: 600,
    height: 500,
    show: true,
    webPreferences: {
      contextIsolation: true,
    },
  })

  const win = create(projectRoot, options, newBrowserWindow)

  debug('creating electron window with options %o', options)

  if (options.type) {
    windows[options.type] = win

    win.once('closed', () => {
      delete windows[options.type!]
    })
  }

  await setWindowProxy(win)
  await win.loadURL(options.url)

  recentlyCreatedWindow = false

  return win
}

export function trackState (projectRoot, isTextTerminal, win, keys: TrackStateMap) {
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

  win.webContents.on('devtools-closed', () => {
    const newState = {}

    newState[keys.devTools] = false

    return savedState.create(projectRoot, isTextTerminal)
    .then((state) => {
      return state.set(newState)
    })
  })
}
