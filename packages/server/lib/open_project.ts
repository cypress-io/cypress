import _ from 'lodash'
import la from 'lazy-ass'
import Debug from 'debug'
import Bluebird from 'bluebird'
import pluralize from 'pluralize'
import assert from 'assert'

import { ProjectBase } from './project-base'
import browsers from './browsers'
import specsUtil from './util/specs'
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
      absoluteSpecPath: spec.absolute,
      specType: spec.specType,
      browserUrl: this.projectBase.cfg.browserUrl,
      integrationFolder: this.projectBase.cfg.integrationFolder || 'integration',
      componentFolder: this.projectBase.cfg.componentFolder || 'component',
      projectRoot: this.projectBase.projectRoot,
    })

    this.projectBase.changeToUrl(newSpecUrl)
  }

  async launch (browser, spec: Cypress.Cypress['spec'], options: LaunchOpts = {
    onError: () => undefined,
  }) {
    this._ctx = getCtx()

    if (!this.projectBase && this._ctx.currentProject) {
      await this.create(this._ctx.currentProject, {
        ...this._ctx.modeOptions,
        projectRoot: this._ctx.currentProject,
        testingType: this._ctx.coreData.currentTestingType!,
      }, options)
    }

    if (!this.projectBase) {
      throw Error('Cannot launch runner if projectBase is undefined!')
    }

    debug('resetting project state, preparing to launch browser %s for spec %o options %o',
      browser.name, spec, options)

    la(_.isPlainObject(browser), 'expected browser object:', browser)

    // reset to reset server and socket state because
    // of potential domain changes, request buffers, etc
    this.projectBase!.reset()

    let url = getSpecUrl({
      absoluteSpecPath: spec.absolute,
      specType: spec.specType,
      browserUrl: this.projectBase.cfg.browserUrl,
      integrationFolder: this.projectBase.cfg.integrationFolder || 'integration',
      componentFolder: this.projectBase.cfg.componentFolder || 'component?',
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
    options.url = url

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
          return
        }

        return browsers.open(browser, options, automation)
      })
    }

    return this.relaunchBrowser()
  }

  getSpecs (cfg) {
    return specsUtil.findSpecs(cfg)
    .then((_specs: Cypress.Spec[] = []) => {
      // only want these properties
      const specs = _specs.map((x) => {
        return {
          name: x.name,
          relative: x.relative,
          absolute: x.absolute,
          specType: x.specType,
        }
      })

      // TODO merge logic with "run.js"
      if (debug.enabled) {
        const names = _.map(specs, 'name')

        debug(
          'found %s using spec pattern \'%s\': %o',
          pluralize('spec', names.length, true),
          cfg.testFiles,
          names,
        )
      }

      const componentTestingEnabled = _.get(cfg, 'resolved.testingType.value', 'e2e') === 'component'

      if (componentTestingEnabled) {
        // separate specs into integration and component lists
        // note: _.remove modifies the array in place and returns removed elements
        const component = _.remove(specs, { specType: 'component' })

        return {
          integration: specs,
          component,
        }
      }

      // assumes all specs are integration specs
      return {
        integration: specs.filter((x) => x.specType === 'integration'),
        component: [],
      }
    })
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
      await this.projectBase.initializeConfig()
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
