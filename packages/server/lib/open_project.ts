import _ from 'lodash'
import la from 'lazy-ass'
import Debug from 'debug'
import Bluebird from 'bluebird'
import chokidar from 'chokidar'
import pluralize from 'pluralize'
import { ProjectBase, OpenProjectLaunchOptions } from './project-base'
import browsers from './browsers'
import specsUtil from './util/specs'
import preprocessor from './plugins/preprocessor'
import runEvents from './plugins/run_events'
import * as session from './session'
import { getSpecUrl } from './project_utils'
import errors from './errors'
import type { Browser, FoundBrowser, PlatformName } from '@packages/launcher'
import { AutomationMiddleware } from './automation'
import { closeGraphQLServer } from '@packages/graphql/src/server'

const debug = Debug('cypress:server:open_project')

interface LaunchOpts {
  browser?: FoundBrowser
  url?: string
  automationMiddleware?: AutomationMiddleware
  onBrowserClose?: (...args: unknown[]) => void
  onError?: (err: Error) => void
}

export interface LaunchArgs {
  _: [string] // Cypress App binary location
  config: Record<string, unknown>
  cwd: string
  browser: Browser
  configFile?: string
  project: string // projectRoot
  projectRoot: string // same as above
  testingType: Cypress.TestingType
  invokedFromCli: boolean
  os: PlatformName

  onFocusTests?: () => any
}

export class OpenProject {
  openProject: ProjectBase<any> | null = null
  relaunchBrowser: ((...args: unknown[]) => void) | null = null
  specsWatcher: chokidar.FSWatcher | null = null
  componentSpecsWatcher: chokidar.FSWatcher | null = null

  resetOpenProject () {
    this.openProject = null
    this.relaunchBrowser = null
  }

  tryToCall (method: keyof ProjectBase<any>) {
    return (...args: unknown[]) => {
      if (this.openProject && this.openProject[method]) {
        return this.openProject[method](...args)
      }

      return Bluebird.resolve(null)
    }
  }

  reset () {
    this.resetOpenProject()
  }

  getConfig () {
    return this.openProject!.getConfig()
  }

  getRecordKeys () {
    return this.tryToCall('getRecordKeys')
  }

  getRuns () {
    return this.tryToCall('getRuns')
  }

  requestAccess () {
    return this.tryToCall('requestAccess')
  }

  getProject () {
    return this.openProject
  }

  changeUrlToSpec (spec: Cypress.Cypress['spec']) {
    if (!this.openProject) {
      return
    }

    const newSpecUrl = getSpecUrl({
      absoluteSpecPath: spec.absolute,
      specType: spec.specType,
      browserUrl: this.openProject.cfg.browserUrl,
      integrationFolder: this.openProject.cfg.integrationFolder || 'integration',
      componentFolder: this.openProject.cfg.componentFolder || 'component',
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

    const url = getSpecUrl({
      absoluteSpecPath: spec.absolute,
      specType: spec.specType,
      browserUrl: this.openProject.cfg.browserUrl,
      integrationFolder: this.openProject.cfg.integrationFolder || 'integration',
      componentFolder: this.openProject.cfg.componentFolder || 'component?',
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
        this.openProject!.options.onError(err)
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
        return browsers.open(browser, options, automation)
      })
    }

    return this.relaunchBrowser()
  }

  getSpecs (cfg) {
    return specsUtil.find(cfg)
    .then((specs: Cypress.Cypress['spec'][] = []) => {
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
        integration: specs,
      }
    })
  }

  getSpecChanges (options: OpenProjectLaunchOptions = {}) {
    let currentSpecs: Cypress.Cypress['spec'][]

    _.defaults(options, {
      onChange: () => { },
      onError: () => { },
    })

    const sendIfChanged = (specs = []) => {
      // dont do anything if the specs haven't changed
      if (_.isEqual(specs, currentSpecs)) {
        return
      }

      currentSpecs = specs

      return options?.onChange?.(specs)
    }

    const checkForSpecUpdates = _.debounce(() => {
      if (!this.openProject) {
        return this.stopSpecsWatcher()
      }

      debug('check for spec updates')

      return get()
      .then(sendIfChanged)
      .catch(options?.onError)
    }, 250, { leading: true })

    const createSpecsWatcher = (cfg) => {
      // TODO I keep repeating this to get the resolved value
      // probably better to have a single function that does this
      const componentTestingEnabled = _.get(cfg, 'resolved.testingType.value', 'e2e') === 'component'

      debug('createSpecWatch component testing enabled', componentTestingEnabled)

      if (!this.specsWatcher) {
        debug('watching integration test files: %s in %s', cfg.testFiles, cfg.integrationFolder)

        this.specsWatcher = chokidar.watch(cfg.testFiles, {
          cwd: cfg.integrationFolder,
          ignored: cfg.ignoreTestFiles,
          ignoreInitial: true,
        })

        this.specsWatcher.on('add', checkForSpecUpdates)

        this.specsWatcher.on('unlink', checkForSpecUpdates)
      }

      if (componentTestingEnabled && !this.componentSpecsWatcher) {
        debug('watching component test files: %s in %s', cfg.testFiles, cfg.componentFolder)

        this.componentSpecsWatcher = chokidar.watch(cfg.testFiles, {
          cwd: cfg.componentFolder,
          ignored: cfg.ignoreTestFiles,
          ignoreInitial: true,
        })

        this.componentSpecsWatcher.on('add', checkForSpecUpdates)

        this.componentSpecsWatcher.on('unlink', checkForSpecUpdates)
      }
    }

    const get = () => {
      if (!this.openProject) {
        return
      }

      const cfg = this.openProject.getConfig()

      createSpecsWatcher(cfg)

      return this.getSpecs(cfg)
    }

    // immediately check the first time around
    return checkForSpecUpdates()
  }

  stopSpecsWatcher () {
    debug('stop spec watcher')

    if (this.specsWatcher) {
      this.specsWatcher.close()
      this.specsWatcher = null
    }

    if (this.componentSpecsWatcher) {
      this.componentSpecsWatcher.close()
      this.componentSpecsWatcher = null
    }

    return Promise.all([
      this.closeOpenProjectAndBrowsers(),
      closeGraphQLServer(),
    ])
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

    this.stopSpecsWatcher()

    return this.closeOpenProjectAndBrowsers()
  }

  async create (path: string, args: LaunchArgs, options: OpenProjectLaunchOptions) {
    debug('open_project create %s', path)

    _.defaults(options, {
      onReloadBrowser: () => {
        if (this.relaunchBrowser) {
          return this.relaunchBrowser()
        }
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

    // store the currently open project
    this.openProject = new ProjectBase({
      testingType: args.testingType === 'component' ? 'component' : 'e2e',
      projectRoot: path,
      options: {
        ...options,
        testingType: args.testingType,
      },
    })

    try {
      await this.openProject.initializeConfig()
      await this.openProject.open()
    } catch (err) {
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
