const _ = require('lodash')
const la = require('lazy-ass')
const debug = require('debug')('cypress:server:open_project')
const Promise = require('bluebird')
const chokidar = require('chokidar')
const pluralize = require('pluralize')
const Project = require('./project-base')
const browsers = require('./browsers')
const specsUtil = require('./util/specs')
const preprocessor = require('./plugins/preprocessor')
const runEvents = require('./plugins/run_events')

const moduleFactory = () => {
  let openProject = null
  let relaunchBrowser = null

  const reset = () => {
    openProject = null
    relaunchBrowser = null
  }

  const tryToCall = (method) => {
    console.log(`Try to call ${method}`)
    return (...args) => {
      if (openProject) {
        return openProject[method](...args)
      }

      return Promise.resolve(null)
    }
  }

  return {
    specsWatcher: null,

    componentSpecsWatcher: null,

    // reset: tryToCall('reset'),

    // getConfig: tryToCall('getConfig'),

    // createCiProject: tryToCall('createCiProject'),

    // writeProjectId: tryToCall('writeProjectId'),

    // getRecordKeys: tryToCall('getRecordKeys'),

    // getRuns: tryToCall('getRuns'),

    // requestAccess: tryToCall('requestAccess'),

    // emit: tryToCall('emit'),

    getProject () {
      return openProject
    },

    changeUrlToSpec (spec) {
      return openProject.getSpecUrl(spec.absolute, spec.specType)
      .then((newSpecUrl) => openProject.changeToUrl(newSpecUrl))
    },

    launch (browser, spec, options = {}) {
      debug('resetting project state, preparing to launch browser %s for spec %o options %o',
        browser.name, spec, options)

      la(_.isPlainObject(browser), 'expected browser object:', browser)

      // reset to reset server and socket state because
      // of potential domain changes, request buffers, etc
      // this.openProject.reset()

      const url = this.openProject.getSpecUrl(spec.absolute, spec.specType)
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

      this.openProject.setCurrentSpecAndBrowser({ spec, browser })

      const automation = this.openProject.automation

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
        if (!this.openProject || cfg.isTextTerminal || !cfg.experimentalInteractiveRunEvents) return Promise.resolve()

        return runEvents.execute('after:spec', cfg, spec)
      }

      const { onBrowserClose } = options

      options.onBrowserClose = () => {
        if (spec && spec.absolute) {
          preprocessor.removeFile(spec.absolute, cfg)
        }

        afterSpec(cfg, spec)
        .catch((err) => {
          this.openProject.options.onError(err)
        })

        if (onBrowserClose) {
          return onBrowserClose()
        }
      }

      options.onError = this.openProject.options.onError

      relaunchBrowser = () => {
        debug(
          'launching browser: %o, spec: %s',
          browser,
          spec.relative,
        )

        return Promise.try(() => {
          if (!cfg.isTextTerminal && cfg.experimentalInteractiveRunEvents) {
            return runEvents.execute('before:spec', cfg, spec)
          }
        })
        .then(() => {
          return browsers.open(browser, options, automation)
        })
      }

      return relaunchBrowser()
    },

    getSpecs (cfg) {
      return specsUtil.find(cfg)
      .then((specs = []) => {
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
    },

    getSpecChanges (options = {}) {
      let currentSpecs = null

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

        return options.onChange(specs)
      }

      const checkForSpecUpdates = _.debounce(() => {
        if (!openProject) {
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

          this.specsWatcher.on('add', (...args) => {
            console.log("A")
            return checkForSpecUpdates(...args)
          })

          this.specsWatcher.on('unlink', checkForSpecUpdates)
        }

        if (componentTestingEnabled && !this.componentSpecsWatcher) {
          debug('watching component test files: %s in %s', cfg.testFiles, cfg.componentFolder)

          this.componentSpecsWatcher = chokidar.watch(cfg.testFiles, {
            cwd: cfg.componentFolder,
            ignored: cfg.ignoreTestFiles,
            ignoreInitial: true,
          })

          this.componentSpecsWatcher.on('add', (...args) => {
            console.log("B")
            return checkForSpecUpdates(...args)
          })

          this.componentSpecsWatcher.on('unlink', checkForSpecUpdates)
        }
      }

      const get = () => {
        const cfg = openProject.getConfig()
        // HERE!!
        createSpecsWatcher(cfg)
        return this.getSpecs(cfg)
      }

      // immediately check the first time around
      return checkForSpecUpdates()
    },

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
    },

    closeBrowser () {
      return browsers.close()
    },

    closeOpenProjectAndBrowsers () {
      return this.closeBrowser()
      .then(() => {
        return this.openProject.close()
      })
      .then(() => {
        reset()

        return null
      })
    },

    close () {
      debug('closing opened project')

      this.stopSpecsWatcher()

      return this.closeOpenProjectAndBrowsers()
    },

    async create (path, args = {}, options = {}) {
      debug('open_project create %s', path)
      debug('and options %o', options)

      _.defaults(options, {
        onReloadBrowser: () => {
          if (relaunchBrowser) {
            return relaunchBrowser()
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
      openProject = new Project.ProjectBase({
        projectType: args.testingType === 'component' ? 'ct' : 'e2e',
        projectRoot: path,
        options
      })

      await openProject.initializeConfig()

      debug('initialize plugins watcher')
      await openProject.initializeWatchers()

      // watch the plugins file for any changes; if it changes,
      // we call initializePlugins again 
      await openProject.watchPluginsFile({
        pluginsFile: openProject.config.pluginsFile,
        isTextTerminal: openProject.config.isTextTerminal,
        onError: openProject.options.onError
      })

      await openProject.initializePlugins(args.testingType)

      this.openProject = openProject

      return openProject
      // return openProject.open({ ...options, testingType: args.testingType })
      // .return(this)
    },

    // for testing purposes
    __reset: reset,
  }
}

module.exports = moduleFactory()

module.exports.Factory = moduleFactory

