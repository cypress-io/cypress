import _ from 'lodash'
import la from 'lazy-ass'
import Debug from 'debug'
import Bluebird from 'bluebird'
import assert from 'assert'

import { ProjectBase } from './project-base'
import browsers from './browsers'
import preprocessor from './plugins/preprocessor'
import runEvents from './plugins/run_events'
import * as session from './session'
import { getSpecUrl } from './project_utils'
import errors from './errors'
import type { LaunchOpts, OpenProjectLaunchOptions, InitializeProjectOptions } from '@packages/types'
import { DataContext, getCtx } from '@packages/data-context'
import { autoBindDebug } from '@packages/data-context/src/util'

const debug = Debug('cypress:server:open_project')

export class OpenProject {
  projectBase: ProjectBase<any> | null = null
  relaunchBrowser: ((...args: unknown[]) => Bluebird<void>) | null = null

  constructor () {
    return autoBindDebug(this)
  }

  resetOpenProject () {
    this.projectBase?.__reset()
    this.projectBase = null
    this.relaunchBrowser = null
  }

  reset () {
    this.resetOpenProject()
  }

  getConfig () {
    return this.projectBase?.getConfig()
  }

  getProject () {
    return this.projectBase
  }

  changeUrlToSpec (spec: Cypress.Cypress['spec']) {
    if (!this.projectBase) {
      return
    }

    const newSpecUrl = getSpecUrl({
      spec,
      browserUrl: this.projectBase.cfg.browserUrl,
      projectRoot: this.projectBase.projectRoot,
    })

    this.projectBase.changeToUrl(newSpecUrl)
  }

  async launch (browser, spec: Cypress.Cypress['spec'], options: LaunchOpts = {
    onError: () => undefined,
  }) {
    this._ctx = getCtx()

    assert(this.projectBase, 'Cannot launch runner if projectBase is undefined!')

    debug('resetting project state, preparing to launch browser %s for spec %o options %o',
      browser.name, spec, options)

    la(_.isPlainObject(browser), 'expected browser object:', browser)

    // reset to reset server and socket state because
    // of potential domain changes, request buffers, etc
    this.projectBase!.reset()

    let url = getSpecUrl({
      spec,
      browserUrl: this.projectBase.cfg.browserUrl,
      projectRoot: this.projectBase.projectRoot,
    })

    debug('open project url %s', url)

    const cfg = this.projectBase.getConfig()

    _.defaults(options, {
      browsers: cfg.browsers,
      userAgent: cfg.userAgent,
      proxyUrl: cfg.proxyUrl,
      proxyServer: cfg.proxyServer,
      socketIoRoute: cfg.socketIoRoute,
      chromeWebSecurity: cfg.chromeWebSecurity,
      isTextTerminal: cfg.isTextTerminal,
      downloadsFolder: cfg.downloadsFolder,
    })

    // if we don't have the isHeaded property
    // then we're in interactive mode and we
    // can assume its a headed browser
    // TODO: we should clean this up
    if (!_.has(browser, 'isHeaded')) {
      browser.isHeaded = true
      browser.isHeadless = false
    }

    // set the current browser object on options
    // so we can pass it down
    options.browser = browser

    if (!process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF) {
      options.url = url
    }

    this.projectBase.setCurrentSpecAndBrowser(spec, browser)

    const automation = this.projectBase.getAutomation()

    // use automation middleware if its
    // been defined here
    let am = options.automationMiddleware

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

      return runEvents.execute('after:spec', cfg, spec)
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

    this.relaunchBrowser = () => {
      debug(
        'launching browser: %o, spec: %s',
        browser,
        spec.relative,
      )

      return Bluebird.try(() => {
        if (!cfg.isTextTerminal && cfg.experimentalInteractiveRunEvents) {
          return runEvents.execute('before:spec', cfg, spec)
        }

        // clear all session data before each spec
        session.clearSessions()
      })
      .then(() => {
        // TODO: Stub this so we can detect it being called
        if (process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF) {
          return browsers.connectToExisting(browser, options, automation)
        }

        return browsers.open(browser, options, automation, this._ctx)
      })
    }

    return this.relaunchBrowser()
  }

  closeBrowser () {
    return browsers.close()
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

    this.closeOpenProjectAndBrowsers()
  }

  // close existing open project if it exists, for example
  // if you are switching from CT to E2E or vice versa.
  // used by launchpad
  async closeActiveProject () {
    await this.closeOpenProjectAndBrowsers()
  }

  _ctx?: DataContext

  async create (path: string, args: InitializeProjectOptions, options: OpenProjectLaunchOptions) {
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

    this._ctx.lifecycleManager.setRunModeExitEarly(options.onError ?? undefined)

    // store the currently open project
    this.projectBase = new ProjectBase({
      testingType,
      projectRoot: path,
      options: {
        ...options,
        testingType,
      },
    })

    try {
      const cfg = await this.projectBase.initializeConfig()

      const { specPattern, ignoreSpecPattern, additionalIgnorePattern } = await this._ctx.actions.project.setSpecsFoundBySpecPattern({
        path,
        testingType,
        specPattern: options.spec || cfg[testingType].specPattern,
        ignoreSpecPattern: cfg[testingType].ignoreSpecPattern,
        additionalIgnorePattern: testingType === 'component' ? cfg?.e2e?.specPattern : undefined,
      })

      this._ctx.project.startSpecWatcher(path, testingType, specPattern, ignoreSpecPattern, additionalIgnorePattern)

      await this.projectBase.open()
    } catch (err: any) {
      if (err.isCypressErr && err.portInUse) {
        errors.throw(err.type, err.port)
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
}

export const openProject = new OpenProject()
