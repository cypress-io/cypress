const _ = require('lodash')
const EE = require('events')
const path = require('path')
const Bluebird = require('bluebird')
const debug = require('debug')('cypress:server:browsers:electron')
const menu = require('../gui/menu')
const Windows = require('../gui/windows')
const { CdpAutomation, screencastOpts } = require('./cdp_automation')
const savedState = require('../saved_state')
const utils = require('./utils')
const errors = require('../errors')

// additional events that are nice to know about to be logged
// https://electronjs.org/docs/api/browser-window#instance-events
const ELECTRON_DEBUG_EVENTS = [
  'close',
  'responsive',
  'session-end',
  'unresponsive',
]

let instance = null

const tryToCall = function (win, method) {
  try {
    if (!win.isDestroyed()) {
      if (_.isString(method)) {
        return win[method]()
      }

      return method()
    }
  } catch (err) {
    return debug('got error calling window method:', err.stack)
  }
}

const _getAutomation = function (win, options, parent) {
  const sendCommand = Bluebird.method((...args) => {
    return tryToCall(win, () => {
      return win.webContents.debugger.sendCommand
      .apply(win.webContents.debugger, args)
    })
  })

  const on = (eventName, cb) => {
    win.webContents.debugger.on('message', (event, method, params) => {
      if (method === eventName) {
        cb(params)
      }
    })
  }

  const automation = new CdpAutomation(sendCommand, on, parent)

  if (!options.onScreencastFrame) {
    // after upgrading to Electron 8, CDP screenshots can hang if a screencast is not also running
    // workaround: start and stop screencasts between screenshots
    // @see https://github.com/cypress-io/cypress/pull/6555#issuecomment-596747134
    automation.onRequest = _.wrap(automation.onRequest, async (fn, message, data) => {
      if (message !== 'take:screenshot') {
        return fn(message, data)
      }

      await sendCommand('Page.startScreencast', screencastOpts)

      const ret = await fn(message, data)

      await sendCommand('Page.stopScreencast')

      return ret
    })
  }

  return automation
}

const _installExtensions = function (win, extensionPaths = [], options) {
  Windows.removeAllExtensions(win)

  return Bluebird.map(extensionPaths, (extensionPath) => {
    try {
      return Windows.installExtension(win, extensionPath)
    } catch (error) {
      return options.onWarning(errors.get('EXTENSION_NOT_LOADED', 'Electron', extensionPath))
    }
  })
}

const _maybeRecordVideo = function (webContents, options) {
  return async () => {
    const { onScreencastFrame } = options

    debug('maybe recording video %o', { onScreencastFrame })

    if (!onScreencastFrame) {
      return
    }

    webContents.debugger.on('message', (event, method, params) => {
      if (method === 'Page.screencastFrame') {
        onScreencastFrame(params)
        webContents.debugger.sendCommand('Page.screencastFrameAck', { sessionId: params.sessionId })
      }
    })

    await webContents.debugger.sendCommand('Page.startScreencast', screencastOpts)
  }
}

module.exports = {
  _defaultOptions (projectRoot, state, options, automation) {
    const _this = this

    const defaults = {
      x: state.browserX,
      y: state.browserY,
      width: state.browserWidth || 1280,
      height: state.browserHeight || 720,
      devTools: state.isBrowserDevToolsOpen,
      minWidth: 100,
      minHeight: 100,
      contextMenu: true,
      partition: this._getPartition(options),
      trackState: {
        width: 'browserWidth',
        height: 'browserHeight',
        x: 'browserX',
        y: 'browserY',
        devTools: 'isBrowserDevToolsOpen',
      },
      webPreferences: {
        sandbox: true,
      },
      onFocus () {
        if (options.show) {
          return menu.set({ withDevTools: true })
        }
      },
      onNewWindow (e, url) {
        const _win = this

        return _this._launchChild(e, url, _win, projectRoot, state, options, automation)
        .then((child) => {
          // close child on parent close
          _win.on('close', () => {
            if (!child.isDestroyed()) {
              child.destroy()
            }
          })

          // add this pid to list of pids
          tryToCall(child, () => {
            if (instance && instance.pid) {
              instance.pid.push(child.webContents.getOSProcessId())
            }
          })
        })
      },
    }

    if (options.browser.isHeadless) {
      // prevents a tiny 1px padding around the window
      // causing screenshots/videos to be off by 1px
      options.resizable = false
    }

    return _.defaultsDeep({}, options, defaults)
  },

  _getAutomation,

  _render (url, automation, preferences = {}, options = {}) {
    const win = Windows.create(options.projectRoot, preferences)

    if (preferences.browser.isHeadless) {
      // seemingly the only way to force headless to a certain screen size
      // electron BrowserWindow constructor is not respecting width/height preferences
      win.setSize(preferences.width, preferences.height)
    } else if (options.isTextTerminal) {
      // we maximize in headed mode as long as it's run mode
      // this is consistent with chrome+firefox headed
      win.maximize()
    }

    return this._launch(win, url, automation, preferences)
    .tap(_maybeRecordVideo(win.webContents, preferences))
    .tap(() => automation.use(_getAutomation(win, preferences, automation)))
  },

  _launchChild (e, url, parent, projectRoot, state, options, automation) {
    e.preventDefault()

    const [parentX, parentY] = parent.getPosition()

    options = this._defaultOptions(projectRoot, state, options)

    _.extend(options, {
      x: parentX + 100,
      y: parentY + 100,
      trackState: false,
    })

    const win = Windows.create(projectRoot, options)

    // needed by electron since we prevented default and are creating
    // our own BrowserWindow (https://electron.atom.io/docs/api/web-contents/#event-new-window)
    e.newGuest = win

    return this._launch(win, url, automation, options)
  },

  _launch (win, url, automation, options) {
    if (options.show) {
      menu.set({ withDevTools: true })
    }

    ELECTRON_DEBUG_EVENTS.forEach((e) => {
      win.on(e, () => {
        debug('%s fired on the BrowserWindow %o', e, { browserWindowUrl: url })
      })
    })

    return Bluebird.try(() => {
      return this._attachDebugger(win.webContents)
    })
    .then(() => {
      let ua

      ua = options.userAgent

      if (ua) {
        this._setUserAgent(win.webContents, ua)
      }

      const setProxy = () => {
        let ps

        ps = options.proxyServer

        if (ps) {
          return this._setProxy(win.webContents, ps)
        }
      }

      return Bluebird.join(
        setProxy(),
        this._clearCache(win.webContents),
      )
    })
    .then(() => {
      return win.loadURL(url)
    })
    .then(() => {
      // enabling can only happen once the window has loaded
      return this._enableDebugger(win.webContents)
    })
    .then(() => {
      return this._handleDownloads(win, options.downloadsFolder, automation)
    })
    .return(win)
  },

  _attachDebugger (webContents) {
    try {
      webContents.debugger.attach('1.3')
      debug('debugger attached')
    } catch (err) {
      debug('debugger attached failed %o', { err })
      throw err
    }

    const originalSendCommand = webContents.debugger.sendCommand

    webContents.debugger.sendCommand = function (message, data) {
      debug('debugger: sending %s with params %o', message, data)

      return originalSendCommand.call(webContents.debugger, message, data)
      .then((res) => {
        let debugRes = res

        if (debug.enabled && (_.get(debugRes, 'data.length') > 100)) {
          debugRes = _.clone(debugRes)
          debugRes.data = `${debugRes.data.slice(0, 100)} [truncated]`
        }

        debug('debugger: received response to %s: %o', message, debugRes)

        return res
      }).catch((err) => {
        debug('debugger: received error on %s: %o', message, err)
        throw err
      })
    }

    webContents.debugger.sendCommand('Browser.getVersion')

    webContents.debugger.on('detach', (event, reason) => {
      debug('debugger detached due to %o', { reason })
    })

    webContents.debugger.on('message', (event, method, params) => {
      if (method === 'Console.messageAdded') {
        debug('console message: %o', params.message)
      }
    })
  },

  _enableDebugger (webContents) {
    debug('debugger: enable Console and Network')

    return webContents.debugger.sendCommand('Console.enable')
  },

  _handleDownloads (win, dir, automation) {
    const onWillDownload = (event, downloadItem) => {
      const savePath = path.join(dir, downloadItem.getFilename())

      automation.push('create:download', {
        id: downloadItem.getETag(),
        filePath: savePath,
        mime: downloadItem.getMimeType(),
        url: downloadItem.getURL(),
      })

      downloadItem.once('done', () => {
        automation.push('complete:download', {
          id: downloadItem.getETag(),
        })
      })
    }

    const { session } = win.webContents

    session.on('will-download', onWillDownload)

    // avoid adding redundant `will-download` handlers if session is reused for next spec
    win.on('closed', () => session.removeListener('will-download', onWillDownload))

    return win.webContents.debugger.sendCommand('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: dir,
    })
  },

  _getPartition (options) {
    if (options.isTextTerminal) {
      // create dynamic persisted run
      // to enable parallelization
      return `persist:run-${process.pid}`
    }

    // we're in interactive mode and always
    // use the same session
    return 'persist:interactive'
  },

  _clearCache (webContents) {
    debug('clearing cache')

    return webContents.session.clearCache()
  },

  _setUserAgent (webContents, userAgent) {
    debug('setting user agent to:', userAgent)
    // set both because why not
    webContents.userAgent = userAgent

    return webContents.session.setUserAgent(userAgent)
  },

  _setProxy (webContents, proxyServer) {
    return webContents.session.setProxy({
      proxyRules: proxyServer,
      // this should really only be necessary when
      // running Chromium versions >= 72
      // https://github.com/cypress-io/cypress/issues/1872
      proxyBypassRules: '<-loopback>',
    })
  },

  open (browser, url, options = {}, automation) {
    const { projectRoot, isTextTerminal } = options

    debug('open %o', { browser, url })

    return savedState.create(projectRoot, isTextTerminal)
    .then((state) => {
      return state.get()
    }).then((state) => {
      debug('received saved state %o', state)

      // get our electron default options
      // TODO: this is bad, don't mutate the options object
      options = this._defaultOptions(projectRoot, state, options, automation)

      // get the GUI window defaults now
      options = Windows.defaults(options)

      debug('browser window options %o', _.omitBy(options, _.isFunction))

      const defaultLaunchOptions = utils.getDefaultLaunchOptions({
        preferences: options,
      })

      return utils.executeBeforeBrowserLaunch(browser, defaultLaunchOptions, options)
    }).then((launchOptions) => {
      const { preferences } = launchOptions

      debug('launching browser window to url: %s', url)

      return this._render(url, automation, preferences, {
        projectRoot: options.projectRoot,
        isTextTerminal: options.isTextTerminal,
      })
      .then(async (win) => {
        await _installExtensions(win, launchOptions.extensions, options)

        // cause the webview to receive focus so that
        // native browser focus + blur events fire correctly
        // https://github.com/cypress-io/cypress/issues/1939
        tryToCall(win, 'focusOnWebView')

        const events = new EE

        win.once('closed', () => {
          debug('closed event fired')

          Windows.removeAllExtensions(win)

          return events.emit('exit')
        })

        instance = _.extend(events, {
          pid: [tryToCall(win, () => {
            return win.webContents.getOSProcessId()
          })],
          browserWindow: win,
          kill () {
            if (this.isProcessExit) {
              // if the process is exiting, all BrowserWindows will be destroyed anyways
              return
            }

            return tryToCall(win, 'destroy')
          },
          removeAllListeners () {
            return tryToCall(win, 'removeAllListeners')
          },
        })

        return instance
      })
    })
  },
}
