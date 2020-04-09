const _ = require('lodash')
const la = require('lazy-ass')
const debug = require('debug')('cypress:server:open_project')
const Promise = require('bluebird')
const chokidar = require('chokidar')
const pluralize = require('pluralize')
const Project = require('./project')
const browsers = require('./browsers')
const specsUtil = require('./util/specs')
const preprocessor = require('./plugins/preprocessor')

const moduleFactory = () => {
  let openProject = null
  let relaunchBrowser = null

  const reset = () => {
    openProject = null
    relaunchBrowser = null
  }

  const tryToCall = (method) => {
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

    reset: tryToCall('reset'),

    getConfig: tryToCall('getConfig'),

    createCiProject: tryToCall('createCiProject'),

    getRecordKeys: tryToCall('getRecordKeys'),

    getRuns: tryToCall('getRuns'),

    requestAccess: tryToCall('requestAccess'),

    emit: tryToCall('emit'),

    getProject () {
      return openProject
    },

    launch (browser, spec, options = {}) {
      debug('resetting project state, preparing to launch browser %s for spec %o options %o',
        browser.name, spec, options)

      la(_.isPlainObject(browser), 'expected browser object:', browser)

      // reset to reset server and socket state because
      // of potential domain changes, request buffers, etc
      return this.reset()
      .then(() => openProject.getSpecUrl(spec.absolute, spec.specType))
      .then((url) => {
        debug('open project url %s', url)

        return openProject.getConfig()
        .then((cfg) => {
          options.browsers = cfg.browsers
          options.proxyUrl = cfg.proxyUrl
          options.userAgent = cfg.userAgent
          options.proxyServer = cfg.proxyUrl
          options.socketIoRoute = cfg.socketIoRoute
          options.chromeWebSecurity = cfg.chromeWebSecurity

          options.url = url

          options.isTextTerminal = cfg.isTextTerminal

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

          openProject.setCurrentSpecAndBrowser(spec, browser)

          const automation = openProject.getAutomation()

          // use automation middleware if its
          // been defined here
          let am = options.automationMiddleware

          if (am) {
            automation.use(am)
          }

          automation.use({
            onBeforeRequest (message, data) {
              if (message === 'take:screenshot') {
                data.specName = spec.name

                return data
              }
            },
          })

          const { onBrowserClose } = options

          options.onBrowserClose = () => {
            if (spec && spec.absolute) {
              preprocessor.removeFile(spec.absolute, cfg)
            }

            if (onBrowserClose) {
              return onBrowserClose()
            }
          }

          options.onError = openProject.options.onError

          relaunchBrowser = () => {
            debug(
              'launching browser: %o, spec: %s',
              browser,
              spec.relative,
            )

            return browsers.open(browser, options, automation)
          }

          return relaunchBrowser()
        })
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
      },
      250, { leading: true })

      const createSpecsWatcher = (cfg) => {
        // TODO I keep repeating this to get the resolved value
        // probably better to have a single function that does this
        const experimentalComponentTestingEnabled = _.get(cfg, 'resolved.experimentalComponentTesting.value', false)

        debug('createSpecWatch component testing enabled', experimentalComponentTestingEnabled)

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

        if (experimentalComponentTestingEnabled && !this.componentSpecsWatcher) {
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
        return openProject.getConfig()
        .then((cfg) => {
          createSpecsWatcher(cfg)

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

            const experimentalComponentTestingEnabled = _.get(cfg, 'resolved.experimentalComponentTesting.value', false)

            if (experimentalComponentTestingEnabled) {
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
        })
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
      return Promise.all([
        this.closeBrowser(),
        openProject ? openProject.close() : undefined,
      ])
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

    create (path, args = {}, options = {}) {
      debug('open_project create %s', path)
      debug('and options %o', options)

      // store the currently open project
      openProject = new Project(path)

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

      options = _.extend({}, args.config, options)

      // open the project and return
      // the config for the project instance
      debug('opening project %s', path)
      debug('and options %o', options)

      return openProject.open(options)
      .return(this)
    },
  }
}

module.exports = moduleFactory()

module.exports.Factory = moduleFactory
