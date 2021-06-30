import _ from 'lodash'
import la from 'lazy-ass'
import Debug from 'debug'
import Bluebird from 'bluebird'
import chokidar from 'chokidar'
import pluralize from 'pluralize'
import { ProjectBase } from './project-base'
import browsers from './browsers'
import specsUtil from './util/specs'
import preprocessor from './plugins/preprocessor'
import { runEvents } from './plugins/run_events'

const debug = Debug('cypress:server:open_project')

interface Specs {
  component: Cypress.Cypress['spec'][]
  integration: Cypress.Cypress['spec'][]
}

export class OpenProject {
  openProject: ProjectBase<any> | undefined
  relaunchBrowser: (() => void) | undefined
  specsWatcher: any = null
  componentSpecsWatcher: any = null
  options: Record<string, any> = {}

  reset () {
    this.openProject = undefined
    this.relaunchBrowser = undefined
  }

  resetProject () {
    return this.openProject!.reset()
  }

  getConfig () {
    return this.openProject!.getConfig()
  }

  createCiProject (projectDetails: any) {
    this.openProject?.createCiProject(projectDetails)
  }

  writeProjectId (id: string) {
    this.openProject?.writeProjectId(id)
  }

  getRecordKeys () {
    this.openProject?.getRecordKeys()
  }

  getRuns () {
    this.openProject?.getRuns()
  }

  requestAccess (projectId: string) {
    this.openProject?.requestAccess(projectId)
  }

  emit (event: string | symbol, ...args: any[]) {
    return this.openProject?.emit(event, ...args)
  }

  getProject () {
    return this.openProject
  }

  open () {
    if (!this.openProject) {
      throw Error('Cannot call OpenProject#open without first calling OpenProject#create')
    }

    return this.openProject.open(this.options)
  }

  changeUrlToSpec (spec: Cypress.Cypress['spec']) {
    if (!this.openProject) {
      throw Error('Cannot call OpenProject#changeUrlToSpec without first calling OpenProject#create')
    }

    return this.openProject.getSpecUrl(spec.absolute, spec.specType)
    .then((newSpecUrl) => this.openProject!.changeToUrl(newSpecUrl))
  }

  launch (browser: Cypress.Browser, spec: Cypress.Cypress['spec'], options: any = {}) {
    debug('resetting project state, preparing to launch browser %s for spec %o options %o',
      browser.name, spec, options)

    la(_.isPlainObject(browser), 'expected browser object:', browser)

    if (!this.openProject) {
      throw Error('openProject should not be undefined.')
    }

    // reset to reset server and socket state because
    // of potential domain changes, request buffers, etc
    return this.resetProject()
    .then(() => this.openProject?.getSpecUrl(spec.absolute, spec.specType))
    .then((url) => {
      debug('open project url %s', url)

      return openProject.getConfig()
      .then((cfg) => {
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

        this.openProject!.setCurrentSpecAndBrowser(spec, browser)

        const automation = this.openProject!.getAutomation()

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
            onPush: null,
            onRequest: null,
            onResponse: null,
            onAfterResponse: null,
          })
        }

        options.onError = this.openProject?.options?.onError

        const afterSpec = () => {
          if (!this.openProject || cfg.isTextTerminal || !cfg.experimentalInteractiveRunEvents) return Bluebird.resolve()

          return runEvents.execute('after:spec', spec)
        }

        const { onBrowserClose } = options

        options.onBrowserClose = () => {
          if (spec && spec.absolute) {
            preprocessor.removeFile(spec.absolute, cfg)
          }

          (afterSpec() as Bluebird<any>)
          .catch((err: Error) => {
            this.openProject?.options?.onError(err)
          })

          if (onBrowserClose) {
            return onBrowserClose()
          }
        }

        this.relaunchBrowser = () => {
          debug(
            'launching browser: %o, spec: %s',
            browser,
            spec.relative,
          )

          return Bluebird.try(() => {
            if (!cfg.isTextTerminal && cfg.experimentalInteractiveRunEvents) {
              return runEvents.execute('before:spec', spec)
            }

            return
          })
          .then(() => {
            return browsers.open(browser, options, automation)
          })
        }

        return this.relaunchBrowser()
      })
    })
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
        component: [],
      }
    })
  }

  getSpecChanges (options: any = {}) {
    let currentSpecs: Specs

    _.defaults(options, {
      onChange: () => { },
      onError: () => { },
    })

    const sendIfChanged = (specs: Specs = { component: [], integration: [] }) => {
      // dont do anything if the specs haven't changed
      if (_.isEqual(specs, currentSpecs)) {
        return
      }

      currentSpecs = specs

      return options.onChange(specs)
    }

    const get = (): Bluebird<Specs> => {
      return this.openProject!.getConfig()
      .then((cfg) => {
        createSpecsWatcher(cfg)

        return this.getSpecs(cfg)
      })
    }

    const checkForSpecUpdates = _.debounce(() => {
      if (!this.openProject) {
        return this.stopSpecsWatcher()
      }

      debug('check for spec updates')

      return get()
      .then(sendIfChanged)
      .catch(options.onError)
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
  }

  closeBrowser () {
    return browsers.close()
  }

  closeOpenProjectAndBrowsers () {
    return this.closeBrowser()
    .then(() => {
      return this?.openProject && this?.openProject.close()
    })
    .then(() => {
      this.reset()

      return null
    })
  }

  close () {
    debug('closing opened project')

    this.stopSpecsWatcher()

    return this.closeOpenProjectAndBrowsers()
  }

  create (path, args: any = {}, options: any = {}) {
    debug('open_project create %s', path)
    debug('and options %o', options)

    // store the currently open project
    this.openProject = new ProjectBase({
      projectType: args.testingType === 'component' ? 'ct' : 'e2e',
      projectRoot: path,
    })

    _.defaults(options, {
      onReloadBrowser: () => {
        return this.relaunchBrowser?.()
      },
    })

    if (!_.isUndefined(args.configFile)) {
      options.configFile = args.configFile
    }

    debug('created project %s', path)
    debug('with options %o', options)

    this.options = _.extend({}, args.config, options, { args }, { testingType: args.testingType })

    // return the project and return
    // the config for the project instance
    return this.getConfig()
    .then((cfg) => {
      return this.openProject!._initPlugins(cfg, this.options)
    })
    .then((val) => {
      const { cfg, specsStore, startSpecWatcher } = val
      this.openProject!.specsStore = specsStore
      this.openProject!.startSpecWatcher = startSpecWatcher
      return cfg
    })
  }

  // for testing purposes
  __reset () {
    this.reset()
  }
}

export const openProject = new OpenProject()
