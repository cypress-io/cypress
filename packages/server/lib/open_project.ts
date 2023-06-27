import _ from 'lodash'
import la from 'lazy-ass'
import Debug from 'debug'
import Bluebird from 'bluebird'
import assert from 'assert'

import { ProjectBase } from './project-base'
import browsers from './browsers'
import * as errors from './errors'
import preprocessor from './plugins/preprocessor'
import runEvents from './plugins/run_events'
import * as session from './session'
import { cookieJar } from './util/cookies'
import { getSpecUrl } from './project_utils'
import type { BrowserLaunchOpts, OpenProjectLaunchOptions, InitializeProjectOptions, OpenProjectLaunchOpts, FoundBrowser } from '@packages/types'
import { DataContext, getCtx } from '@packages/data-context'
import { autoBindDebug } from '@packages/data-context/src/util'
import type { BrowserInstance } from './browsers/types'

const debug = Debug('cypress:server:open_project')

export class OpenProject {
  private projectBase: ProjectBase<any> | null = null
  relaunchBrowser: (() => Promise<BrowserInstance | null>) = () => {
    throw new Error('bad relaunch')
  }

  constructor () {
    return autoBindDebug(this)
  }

  resetOpenProject () {
    this.projectBase?.__reset()
    this.projectBase = null
    this.relaunchBrowser = () => {
      throw new Error('bad relaunch after reset')
    }
  }

  reset () {
    cookieJar.removeAllCookies()
    session.clearSessions(true)
    this.resetOpenProject()
  }

  getConfig () {
    return this.projectBase?.getConfig()
  }

  getRemoteStates () {
    return this.projectBase?.remoteStates
  }

  getProject () {
    return this.projectBase
  }

  async launch (browser, spec: Cypress.Cypress['spec'], prevOptions?: OpenProjectLaunchOpts) {
    this._ctx = getCtx()

    assert(this.projectBase, 'Cannot launch runner if projectBase is undefined!')

    debug('resetting project state, preparing to launch browser %s for spec %o options %o',
      browser.name, spec, prevOptions)

    la(_.isPlainObject(browser), 'expected browser object:', browser)

    // reset to reset server and socket state because
    // of potential domain changes, request buffers, etc
    this.projectBase!.reset()

    const url = process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF ? undefined : getSpecUrl({
      spec,
      browserUrl: this.projectBase.cfg.browserUrl,
      projectRoot: this.projectBase.projectRoot,
    })

    debug('open project url %s', url)

    const cfg = this.projectBase.getConfig()

    if (!cfg.proxyServer) throw new Error('Missing proxyServer in launch')

    const options: BrowserLaunchOpts = {
      browser,
      url,
      // TODO: fix majorVersion discrepancy that causes this to be necessary
      browsers: cfg.browsers as FoundBrowser[],
      userAgent: cfg.userAgent,
      proxyUrl: cfg.proxyUrl,
      proxyServer: cfg.proxyServer,
      socketIoRoute: cfg.socketIoRoute,
      chromeWebSecurity: cfg.chromeWebSecurity,
      isTextTerminal: !!cfg.isTextTerminal,
      downloadsFolder: cfg.downloadsFolder,
      experimentalModifyObstructiveThirdPartyCode: cfg.experimentalModifyObstructiveThirdPartyCode,
      experimentalWebKitSupport: cfg.experimentalWebKitSupport,
      ...prevOptions || {},
    }

    // if we don't have the isHeaded property
    // then we're in interactive mode and we
    // can assume its a headed browser
    // TODO: we should clean this up
    if (!_.has(browser, 'isHeaded')) {
      browser.isHeaded = true
      browser.isHeadless = false
    }

    this.projectBase.setCurrentSpecAndBrowser(spec, browser)

    const automation = this.projectBase.getAutomation()

    // use automation middleware if its
    // been defined here
    const am = options.automationMiddleware

    if (am) {
      automation.use(am)
    }

    if (!am || !am.onBeforeRequest) {
      automation.use({
        onBeforeRequest (message, data) {
          if (message === 'take:screenshot') {
            data.specName = spec.name

            return data
          }
        },
      })
    }

    const afterSpec = () => {
      if (!this.projectBase || cfg.isTextTerminal || !cfg.experimentalInteractiveRunEvents) {
        return Bluebird.resolve()
      }

      return runEvents.execute('after:spec', spec)
    }

    const { onBrowserClose } = options

    options.onBrowserClose = () => {
      if (spec && spec.absolute) {
        preprocessor.removeFile(spec.absolute, cfg)
      }

      afterSpec()
      .catch((err) => {
        this.projectBase?.options.onError?.(err)
      })

      if (onBrowserClose) {
        return onBrowserClose()
      }
    }

    options.onError = this.projectBase.options.onError

    this.relaunchBrowser = async () => {
      debug(
        'launching browser: %o, spec: %s',
        browser,
        spec.relative,
      )

      // clear cookies and all session data before each spec
      cookieJar.removeAllCookies()
      session.clearSessions()

      // TODO: Stub this so we can detect it being called
      if (process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF) {
        return await browsers.connectToExisting(browser, options, automation)
      }

      if (options.shouldLaunchNewTab) {
        const onInitializeNewBrowserTab = async () => {
          await this.resetBrowserState()
        }

        // If we do not launch the browser,
        // we tell it that we are ready
        // to receive the next spec
        return await browsers.connectToNewSpec(browser, { onInitializeNewBrowserTab, ...options }, automation)
      }

      options.relaunchBrowser = this.relaunchBrowser

      return await browsers.open(browser, options, automation, this._ctx)
    }

    return this.relaunchBrowser()
  }

  closeBrowser () {
    return browsers.close()
  }

  async resetBrowserTabsForNextTest (shouldKeepTabOpen: boolean) {
    try {
      await this.projectBase?.resetBrowserTabsForNextTest(shouldKeepTabOpen)
    } catch (e) {
      // If the CRI client disconnected or crashed, we want to no-op here so that anything
      // depending on resetting the browser tabs can continue with further operations
      return
    }
  }

  async resetBrowserState () {
    return this.projectBase?.resetBrowserState()
  }

  closeOpenProjectAndBrowsers () {
    this.projectBase?.close().catch((e) => {
      this._ctx?.logTraceError(e)
    })

    this.resetOpenProject()

    return this.closeBrowser()
  }

  close () {
    debug('closing opened project')

    return this.closeOpenProjectAndBrowsers()
  }

  changeUrlToSpec (spec: Cypress.Spec) {
    if (!this.projectBase) {
      debug('No projectBase, cannot change url')

      return
    }

    const newSpecUrl = getSpecUrl({
      projectRoot: this.projectBase.projectRoot,
      spec,
    })

    debug(`New url is ${newSpecUrl}`)

    this.projectBase.server._socket.changeToUrl(newSpecUrl)
  }

  changeUrlToDebug () {
    if (!this.projectBase) {
      debug('No projectBase, cannot change url')

      return
    }

    const newUrl = `#/debug`

    debug(`New url is ${newUrl}`)

    this.projectBase.server._socket.changeToUrl(newUrl)
  }

  /**
   * Sends the new telemetry context to the browser
   * @param context - telemetry context string
   * @returns
   */
  updateTelemetryContext (context: string) {
    return this.projectBase?.server._socket.updateTelemetryContext(context)
  }

  // close existing open project if it exists, for example
  // if you are switching from CT to E2E or vice versa.
  // used by launchpad
  async closeActiveProject () {
    await this.closeOpenProjectAndBrowsers()
  }

  _ctx?: DataContext

  async create (path: string, args: InitializeProjectOptions, options: OpenProjectLaunchOptions) {
    // ensure switching to a new project in cy-in-cy tests and from the launchpad starts with a clean slate
    this.reset()
    this._ctx = getCtx()
    debug('open_project create %s', path)

    _.defaults(options, {
      onReloadBrowser: () => {
        if (this.relaunchBrowser) {
          return this.relaunchBrowser()
        }

        return
      },
    })

    if (!_.isUndefined(args.configFile) && !_.isNull(args.configFile)) {
      options.configFile = args.configFile
    }

    options = _.extend({}, args.config, options, { args })

    // open the project and return
    // the config for the project instance
    debug('opening project %s', path)
    debug('and options %o', options)

    assert(args.testingType)

    const testingType = args.testingType === 'component' ? 'component' : 'e2e'

    this._ctx.lifecycleManager.runModeExitEarly = options.onError ?? undefined

    // store the currently open project
    this.projectBase = new ProjectBase({
      testingType,
      projectRoot: path,
      options: {
        ...options,
        testingType,
      },
    })

    // This was previously in the ProjectBase constructor but is now async
    await this._ctx.lifecycleManager.setCurrentProject(path)

    try {
      await this.projectBase.initializeConfig()

      await this.projectBase.open()
    } catch (err: any) {
      if (err.isCypressErr && err.portInUse) {
        errors.throwErr(err.type, err.port)
      } else {
        // rethrow and handle elsewhere
        throw (err)
      }
    }

    return this
  }

  // for testing purposes
  __reset () {
    this.resetOpenProject()
  }

  async sendFocusBrowserMessage () {
    const isRunnerConnected = this.projectBase?.isRunnerSocketConnected()

    // If the runner's socket is active and connected, we focus the active window
    if (isRunnerConnected) {
      return this.projectBase?.sendFocusBrowserMessage()
    }

    // Otherwise, we relaunch the app in the current browser
    if (this.relaunchBrowser) {
      return this.relaunchBrowser()
    }
  }
}

export const openProject = new OpenProject()
