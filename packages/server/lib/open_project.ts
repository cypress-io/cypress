import _ from 'lodash'
import la from 'lazy-ass'
import Debug from 'debug'
import Bluebird from 'bluebird'
import { ProjectBase } from './project-base'
import browsers from './browsers'
import preprocessor from './plugins/preprocessor'
import runEvents from './plugins/run_events'
import * as session from './session'
import { getSpecUrl } from './project_utils'
import errors from './errors'
import type { LaunchOpts, LaunchArgs, OpenProjectLaunchOptions, FoundBrowser } from '@packages/types'
import type { DataContext } from '@packages/data-context'
import { getCtx } from './makeDataContext'

const debug = Debug('cypress:server:open_project')

export class OpenProject {
  openProject: ProjectBase<any> | null = null
  relaunchBrowser: ((...args: unknown[]) => Bluebird<void>) | null = null

  resetOpenProject () {
    this.openProject = null
    this.relaunchBrowser = null
  }

  reset () {
    this.resetOpenProject()
  }

  getConfig () {
    return this.openProject?.getConfig()
  }

  getProject () {
    return this.openProject
  }

  changeUrlToSpec (spec: Cypress.Cypress['spec']) {
    if (!this.openProject) {
      return
    }

    const newSpecUrl = getSpecUrl({
      spec,
      browserUrl: this.openProject.cfg.browserUrl,
      projectRoot: this.openProject.projectRoot,
    })

    this.openProject.changeToUrl(newSpecUrl)
  }

  launch (browser, spec: Cypress.Cypress['spec'], options: LaunchOpts = {
    onError: () => undefined,
  }) {
    if (!this.openProject) {
      throw Error('Cannot launch runner if openProject is undefined!')
    }

    debug('resetting project state, preparing to launch browser %s for spec %o options %o',
      browser.name, spec, options)

    la(_.isPlainObject(browser), 'expected browser object:', browser)

    // reset to reset server and socket state because
    // of potential domain changes, request buffers, etc
    this.openProject!.reset()

    let url = getSpecUrl({
      spec,
      browserUrl: this.openProject.cfg.browserUrl,
      projectRoot: this.openProject.projectRoot,
    })

    debug('open project url %s', url)

    const cfg = this.openProject.getConfig()

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
    options.url = url

    this.openProject.setCurrentSpecAndBrowser(spec, browser)

    const automation = this.openProject.getAutomation()

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
      if (!this.openProject || cfg.isTextTerminal || !cfg.experimentalInteractiveRunEvents) {
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
        this.openProject?.options.onError(err)
      })

      if (onBrowserClose) {
        return onBrowserClose()
      }
    }

    options.onError = this.openProject.options.onError

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
        if (options.skipBrowserOpenForTest) {
          return
        }

        return browsers.open(browser, options, automation)
      })
    }

    return this.relaunchBrowser()
  }

  closeBrowser () {
    return browsers.close()
  }

  closeOpenProjectAndBrowsers () {
    return this.closeBrowser()
    .then(() => {
      return this.openProject?.close()
    })
    .then(() => {
      this.resetOpenProject()

      return null
    })
  }

  close () {
    debug('closing opened project')

    return Promise.all([
      this._ctx?.destroy(),
      this.closeOpenProjectAndBrowsers(),
    ]).then(() => null)
  }

  // close existing open project if it exists, for example
  // if  you are switching from CT to E2E or vice versa.
  // used by launchpad
  async closeActiveProject () {
    await this.closeOpenProjectAndBrowsers()
  }

  _ctx?: DataContext

  async create (path: string, args: LaunchArgs, options: OpenProjectLaunchOptions, browsers: FoundBrowser[] = []) {
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

    if (!_.isUndefined(args.configFile)) {
      options.configFile = args.configFile
    }

    options = _.extend({}, args.config, options, { args })

    // open the project and return
    // the config for the project instance
    debug('opening project %s', path)
    debug('and options %o', options)

    const testingType = args.testingType === 'component' ? 'component' : 'e2e'

    // store the currently open project
    this.openProject = new ProjectBase({
      testingType,
      projectRoot: path,
      options: {
        ...options,
        testingType,
      },
    })

    try {
      await this.openProject.initializeConfig(browsers)
      await this.openProject.open()
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
