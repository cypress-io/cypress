import _ from 'lodash'
import EE from 'events'
import path from 'path'
import Debug from 'debug'
import menu from '../gui/menu'
import * as Windows from '../gui/windows'
import { CdpAutomation, screencastOpts } from './cdp_automation'
import * as savedState from '../saved_state'
import utils from './utils'
import * as errors from '../errors'
import type { Browser, BrowserInstance } from './types'
import type { BrowserWindow } from 'electron'
import type { Automation } from '../automation'
import type { BrowserLaunchOpts, Preferences, RunModeVideoApi } from '@packages/types'
import memory from './memory'
import { BrowserCriClient } from './browser-cri-client'
import { getRemoteDebuggingPort } from '../util/electron-app'

// TODO: unmix these two types
type ElectronOpts = Windows.WindowOptions & BrowserLaunchOpts

const debug = Debug('cypress:server:browsers:electron')

// additional events that are nice to know about to be logged
// https://electronjs.org/docs/api/browser-window#instance-events
const ELECTRON_DEBUG_EVENTS = [
  'close',
  'responsive',
  'session-end',
  'unresponsive',
]

let instance: BrowserInstance | null = null
let browserCriClient: BrowserCriClient | null = null

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

const _getAutomation = async function (win, options: BrowserLaunchOpts, parent) {
  if (!options.onError) throw new Error('Missing onError in electron#_launch')

  const port = getRemoteDebuggingPort()

  if (!browserCriClient) {
    browserCriClient = await BrowserCriClient.create(['127.0.0.1'], port, 'electron', options.onError, () => {})
  }

  const pageCriClient = await browserCriClient.attachToTargetUrl('about:blank')

  const sendClose = () => {
    win.destroy()
  }

  const automation = await CdpAutomation.create(pageCriClient.send, pageCriClient.on, sendClose, parent)

  automation.onRequest = _.wrap(automation.onRequest, async (fn, message, data) => {
    switch (message) {
      case 'take:screenshot': {
        // after upgrading to Electron 8, CDP screenshots can hang if a screencast is not also running
        // workaround: start and stop screencasts between screenshots
        // @see https://github.com/cypress-io/cypress/pull/6555#issuecomment-596747134
        if (!options.videoApi) {
          await pageCriClient.send('Page.startScreencast', screencastOpts())
          const ret = await fn(message, data)

          await pageCriClient.send('Page.stopScreencast')

          return ret
        }

        return fn(message, data)
      }
      case 'focus:browser:window': {
        win.show()

        return
      }
      default: {
        return fn(message, data)
      }
    }
  })

  return automation
}

function _installExtensions (win: BrowserWindow, extensionPaths: string[], options) {
  Windows.removeAllExtensions(win)

  return Promise.all(extensionPaths.map((extensionPath) => {
    try {
      return Windows.installExtension(win, extensionPath)
    } catch (error) {
      return options.onWarning(errors.get('EXTENSION_NOT_LOADED', 'Electron', extensionPath))
    }
  }))
}

async function recordVideo (cdpAutomation: CdpAutomation, videoApi: RunModeVideoApi) {
  const { writeVideoFrame } = await videoApi.useFfmpegVideoController()

  await cdpAutomation.startVideoRecording(writeVideoFrame, screencastOpts())
}

export = {
  // For testing
  _clearBrowserCriClient () {
    browserCriClient = null
  },
  _defaultOptions (projectRoot: string | undefined, state: Preferences, options: BrowserLaunchOpts, automation: Automation): ElectronOpts {
    const _this = this

    const defaults: Windows.WindowOptions = {
      x: state.browserX || undefined,
      y: state.browserY || undefined,
      width: state.browserWidth || 1280,
      height: state.browserHeight || 720,
      minWidth: 100,
      minHeight: 100,
      devTools: state.isBrowserDevToolsOpen || undefined,
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
      show: !options.browser.isHeadless,
      // prevents a tiny 1px padding around the window
      // causing screenshots/videos to be off by 1px
      resizable: !options.browser.isHeadless,
      async onCrashed () {
        const err = errors.get('RENDERER_CRASHED')

        await memory.endProfiling()

        if (!options.onError) {
          errors.log(err)
          throw new Error('Missing onError in onCrashed')
        }

        options.onError(err)
      },
      onFocus () {
        if (!options.browser.isHeadless) {
          return menu.set({ withInternalDevTools: true })
        }
      },
      async onNewWindow (this: BrowserWindow, e, url) {
        const _win = this

        const child = await _this._launchChild(e, url, _win, projectRoot, state, options, automation)

        // close child on parent close
        _win.on('close', () => {
          if (!child.isDestroyed()) {
            child.destroy()
          }
        })

        // add this pid to list of pids
        tryToCall(child, () => {
          if (instance && instance.pid) {
            if (!instance.allPids) throw new Error('Missing allPids!')

            instance.allPids.push(child.webContents.getOSProcessId())
          }
        })
      },
    }

    return _.defaultsDeep({}, options, defaults)
  },

  _getAutomation,

  async _render (url: string, automation: Automation, preferences, options: ElectronOpts) {
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

    return await this._launch(win, url, automation, preferences, options.videoApi)
  },

  _launchChild (e, url, parent, projectRoot, state, options, automation) {
    e.preventDefault()

    const [parentX, parentY] = parent.getPosition()

    const electronOptions = this._defaultOptions(projectRoot, state, options, automation)

    _.extend(electronOptions, {
      x: parentX + 100,
      y: parentY + 100,
      trackState: false,
      // in run mode, force new windows to automatically open with show: false
      // this prevents window.open inside of javascript client code to cause a new BrowserWindow instance to open
      // https://github.com/cypress-io/cypress/issues/123
      show: !options.isTextTerminal,
    })

    const win = Windows.create(projectRoot, electronOptions)

    // needed by electron since we prevented default and are creating
    // our own BrowserWindow (https://electron.atom.io/docs/api/web-contents/#event-new-window)
    e.newGuest = win

    return this._launch(win, url, automation, electronOptions)
  },

  async _launch (win: BrowserWindow, url: string, automation: Automation, options: ElectronOpts, videoApi?: RunModeVideoApi) {
    if (options.show) {
      menu.set({ withInternalDevTools: true })
    }

    ELECTRON_DEBUG_EVENTS.forEach((e) => {
      // @ts-expect-error mapping strings to event names is failing typecheck
      win.on(e, () => {
        debug('%s fired on the BrowserWindow %o', e, { browserWindowUrl: url })
      })
    })

    await win.loadURL('about:blank')
    const cdpAutomation = await this._getAutomation(win, options, automation)

    automation.use(cdpAutomation)

    const ua = options.userAgent

    if (ua) {
      this._setUserAgent(win.webContents, ua)
      // @see https://github.com/cypress-io/cypress/issues/22953
    } else if (options.experimentalModifyObstructiveThirdPartyCode) {
      const userAgent = this._getUserAgent(win.webContents)
      // replace any obstructive electron user agents that contain electron or cypress references to appear more chrome-like
      const modifiedNonObstructiveUserAgent = userAgent.replace(/Cypress.*?\s|[Ee]lectron.*?\s/g, '')

      this._setUserAgent(win.webContents, modifiedNonObstructiveUserAgent)
    }

    const setProxy = () => {
      let ps

      ps = options.proxyServer

      if (ps) {
        return this._setProxy(win.webContents, ps)
      }
    }

    await Promise.all([
      setProxy(),
      this._clearCache(win.webContents),
    ])

    await Promise.all([
      videoApi && recordVideo(cdpAutomation, videoApi),
      this._handleDownloads(win, options.downloadsFolder, automation),
    ])

    // enabling can only happen once the window has loaded
    await this._enableDebugger()

    await win.loadURL(url)
    this._listenToOnBeforeHeaders(win)

    return win
  },

  _enableDebugger () {
    debug('debugger: enable Console and Network')

    return browserCriClient?.currentlyAttachedTarget?.send('Console.enable')
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

    return browserCriClient?.currentlyAttachedTarget?.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: dir,
    })
  },

  _listenToOnBeforeHeaders (win: BrowserWindow) {
    // true if the frame only has a single parent, false otherwise
    const isFirstLevelIFrame = (frame) => (!!frame?.parent && !frame.parent.parent)

    // adds a header to the request to mark it as a request for the AUT frame
    // itself, so the proxy can utilize that for injection purposes
    win.webContents.session.webRequest.onBeforeSendHeaders((details, cb) => {
      const requestModifications = {
        requestHeaders: {
          ...details.requestHeaders,
          /**
           * Unlike CDP, Electrons's onBeforeSendHeaders resourceType cannot discern the difference
           * between fetch or xhr resource types, but classifies both as 'xhr'. Because of this,
           * we set X-Cypress-Is-XHR-Or-Fetch to true if the request is made with 'xhr' or 'fetch' so the
           * middleware doesn't incorrectly assume which request type is being sent
           * @see https://www.electronjs.org/docs/latest/api/web-request#webrequestonbeforesendheadersfilter-listener
           */
          ...(details.resourceType === 'xhr') ? {
            'X-Cypress-Is-XHR-Or-Fetch': 'true',
          } : {},
        },
      }

      if (
        // isn't an iframe
        details.resourceType !== 'subFrame'
        // the top-level frame or a nested frame
        || !isFirstLevelIFrame(details.frame)
        // is the spec frame, not the AUT
        || details.url.includes('__cypress')
      ) {
        cb(requestModifications)

        return
      }

      cb({
        requestHeaders: {
          ...requestModifications.requestHeaders,
          'X-Cypress-Is-AUT-Frame': 'true',
        },
      })
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

  _getUserAgent (webContents) {
    const userAgent = webContents.session.getUserAgent()

    debug('found user agent: %s', userAgent)

    return userAgent
  },

  _setUserAgent (webContents, userAgent) {
    debug('setting user agent to:', userAgent)
    // set both because why not
    webContents.userAgent = userAgent

    // In addition to the session, also set the user-agent optimistically through CDP. @see https://github.com/cypress-io/cypress/issues/23597
    browserCriClient?.currentlyAttachedTarget?.send('Network.setUserAgentOverride', {
      userAgent,
    })

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

  /**
   * Clear instance state for the electron instance, this is normally called on kill or on exit, for electron there isn't any state to clear.
   */
  clearInstanceState () {
    // Do nothing on failure here since we're shutting down anyway
    browserCriClient?.close().catch()
    browserCriClient = null
  },

  async connectToNewSpec (browser: Browser, options: ElectronOpts, automation: Automation) {
    if (!options.url) throw new Error('Missing url in connectToNewSpec')

    return this.open(browser, options.url, options, automation)
  },

  connectToExisting () {
    throw new Error('Attempting to connect to existing browser for Cypress in Cypress which is not yet implemented for electron')
  },

  validateLaunchOptions (launchOptions: typeof utils.defaultLaunchOptions) {
    const options: string[] = []

    if (Object.keys(launchOptions.env).length > 0) options.push('env')

    if (launchOptions.args.length > 0) options.push('args')

    if (options.length > 0) {
      errors.warning('BROWSER_UNSUPPORTED_LAUNCH_OPTION', 'electron', options)
    }
  },

  async open (browser: Browser, url: string, options: BrowserLaunchOpts, automation: Automation) {
    debug('open %o', { browser, url })

    const State = await savedState.create(options.projectRoot, options.isTextTerminal)
    const state = await State.get()

    debug('received saved state %o', state)

    // get our electron default options
    const electronOptions: ElectronOpts = Windows.defaults(
      this._defaultOptions(options.projectRoot, state, options, automation),
    )

    debug('browser window options %o', _.omitBy(electronOptions, _.isFunction))

    const defaultLaunchOptions = utils.getDefaultLaunchOptions({
      preferences: electronOptions,
    })

    const launchOptions = await utils.executeBeforeBrowserLaunch(browser, defaultLaunchOptions, electronOptions)

    this.validateLaunchOptions(launchOptions)

    const { preferences } = launchOptions

    debug('launching browser window to url: %s', url)

    const win = await this._render(url, automation, preferences, electronOptions)

    await _installExtensions(win, launchOptions.extensions, electronOptions)

    // cause the webview to receive focus so that
    // native browser focus + blur events fire correctly
    // https://github.com/cypress-io/cypress/issues/1939
    tryToCall(win, 'focusOnWebView')

    const events = new EE()

    win.once('closed', () => {
      debug('closed event fired')

      Windows.removeAllExtensions(win)

      return events.emit('exit')
    })

    const mainPid: number = tryToCall(win, () => {
      return win.webContents.getOSProcessId()
    })

    const clearInstanceState = this.clearInstanceState

    instance = _.extend(events, {
      pid: mainPid,
      allPids: [mainPid],
      browserWindow: win,
      kill (this: BrowserInstance) {
        clearInstanceState()

        if (this.isProcessExit) {
          // if the process is exiting, all BrowserWindows will be destroyed anyways
          return
        }

        return tryToCall(win, 'destroy')
      },
      removeAllListeners () {
        return tryToCall(win, 'removeAllListeners')
      },
    }) as BrowserInstance

    return instance
  },
}
