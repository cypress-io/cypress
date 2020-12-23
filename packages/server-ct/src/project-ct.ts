import Bluebird from 'bluebird'
import Debug from 'debug'
import { EventEmitter } from 'events'
import _ from 'lodash'
import path from 'path'
import { RootRunnable, RunnablesStore } from '@packages/reporter/src/runnables/runnables-store'
import config from '@packages/server/lib/config'
import cwd from '@packages/server/lib/cwd'
import errors from '@packages/server/lib/errors'
import plugins from '@packages/server/lib/plugins'
import devServer from '@packages/server/lib/plugins/dev-server'
import Reporter from '@packages/server/lib/reporter'
import savedState from '@packages/server/lib/saved_state'
import { escapeFilenameInUrl } from '@packages/server/lib/util/escape_filename'
import fs from '@packages/server/lib/util/fs'
import settings from '@packages/server/lib/util/settings'
import specsUtil from '@packages/server/lib/util/specs'
import Watchers from '@packages/server/lib/watchers'
import { Server } from './server-ct'
import { SpecsController } from './specs-controller'

const debug = Debug('cypress:server-ct:project')
const localCwd = cwd()
const multipleForwardSlashesRe = /[^:\/\/](\/{2,})/g

export default class ProjectCt extends EventEmitter {
  cfg: any
  private projectRoot: string
  private watchers: Watchers
  private server: Server
  private options: Record<string, any>
  private spec: Cypress.Cypress['spec']
  private browser: any
  private automation: any

  constructor (projectRoot: string) {
    super()

    if (!(this instanceof ProjectCt)) {
      return new ProjectCt(projectRoot)
    }

    if (!projectRoot) {
      throw new Error('Instantiating server-ct/src/project requires a projectRoot!')
    }

    this.projectRoot = path.resolve(projectRoot)
    this.watchers = new Watchers()
    this.cfg = null
    // this.spec = null
    // this.browser = null
    this.server = null
    // this.automation = null

    debug('Project created %s', this.projectRoot)
  }

  open (options = {}) {
    debug('opening project instance %s', this.projectRoot)
    debug('project open options %o', options)
    this.server = new Server()

    debug('project options %o', options)
    this.options = options

    return this.getConfig(options)
    .tap(() => {
      process.chdir(this.projectRoot)
    })
    .then((cfg) => {
      return this._initPlugins(cfg, options)
      .then(({ cfg, specs }) => {
        // return this.server.open(cfg, this, options.onError, options.onWarning)
        // @ts-ignore
        return this.server.open(cfg, specs, this)
        .spread((port, warning) => {
          // if we didnt have a cfg.port
          // then get the port once we
          // open the server

          cfg.proxyServer = null

          if (!cfg.port) {
            cfg.port = port

            // and set all the urls again
            _.extend(cfg, config.setUrls(cfg))
          }

          // store the cfg from
          // opening the server
          this.cfg = cfg

          debug('project config: %o', _.omit(cfg, 'resolved'))

          // if (warning) {
          //   options.onWarning(warning)
          // }

          // options.onSavedStateChanged = (state) => this.saveState(state)

          return Bluebird.all([
            this.watchSettingsAndStartWebsockets(options, cfg),
            // this.scaffold(cfg),
          ])
          .then(() => {
            return Bluebird.join(
              // @ts-ignore - should move this to async/await for sanity
              this.watchPluginsFile(cfg, options),
            )
          })
        })
      })
      .return(this)
    })
  }

  _initPlugins (cfg, options) {
    // only init plugins with the
    // allowed config values to
    // prevent tampering with the
    // internals and breaking cypress
    const allowedCfg = config.allowed(cfg)

    return plugins.init(allowedCfg, {
      projectRoot: this.projectRoot,
      configFile: settings.pathToConfigFile(this.projectRoot, options),
    })
    .then((modifiedCfg) => {
      debug('plugin config yielded: %o', modifiedCfg)

      const updatedConfig = config.updateWithPluginValues(cfg, modifiedCfg)

      updatedConfig.componentTesting = true

      debug('updated config: %o', updatedConfig)

      return updatedConfig
    })
    .then((modifiedConfig) => {
      // now that plugins have been initialized, we want to execute
      // the plugin event for 'dev-server:start' and get back
      // @ts-ignore - let's not attempt to TS all the things in packages/server

      return specsUtil.find(modifiedConfig)
      .filter((spec: Cypress.Cypress['spec']) => {
        return spec.specType === 'component'
      }).then((specs) => {
        return devServer.start({ specs, config: modifiedConfig })
        .then((port) => {
          modifiedConfig.webpackDevServerUrl = `http://localhost:${port}`

          const specs = new SpecsController(cfg)

          specs.watch({
            onSpecsChanged: (specs) => {
              console.log('THESE ARE MY SPECS', specs)
              // send new files to dev server
              devServer.updateSpecs(specs)

              // send new files to frontend
              this.server.sendSpecList(specs)
            },
          })

          return specs.storeSpecFiles()
          .return({
            specs,
            cfg: modifiedConfig,
          })
        })
      })
    })
  }

  reset () {
    debug('resetting project instance %s', this.projectRoot)

    this.spec = null
    this.browser = null

    return Bluebird.try(() => {
      if (this.automation) {
        this.automation.reset()
      }

      let state

      if (this.server) {
        state = this.server.reset()
      }

      return state
    })
  }

  close () {
    debug('closing project instance %s', this.projectRoot)

    this.cfg = null
    this.spec = null
    this.browser = null

    return Bluebird.all([
      this.server ? this.server.close() : undefined,
      this.watchers ? this.watchers.close() : undefined,
      // preprocessor.close(),
    ])
    .then(() => {
      return process.chdir(localCwd)
    })
  }

  watchPluginsFile (cfg, options) {
    debug(`attempt watch plugins file: ${cfg.pluginsFile}`)
    if (!cfg.pluginsFile || options.isTextTerminal) {
      return Bluebird.resolve()
    }

    return fs.pathExists(cfg.pluginsFile)
    .then((found) => {
      debug(`plugins file found? ${found}`)
      // ignore if not found. plugins#init will throw the right error
      if (!found) {
        return
      }

      debug('watch plugins file')

      return this.watchers.watchTree(cfg.pluginsFile, {
        onChange: () => {
          // TODO: completely re-open project instead?
          debug('plugins file changed')

          // re-init plugins after a change
          this._initPlugins(cfg, options)
          .catch((err) => {
            options.onError(err)
          })
        },
      })
    })
  }

  // watchSettings (onSettingsChanged, options) {
  //   // bail if we havent been told to
  //   // watch anything (like in run mode)
  //   if (!onSettingsChanged) {
  //     return
  //   }

  //   debug('watch settings files')

  //   const obj = {
  //     onChange: () => {
  //       // dont fire change events if we generated
  //       // a project id less than 1 second ago
  //       if (this.generatedProjectIdTimestamp &&
  //         ((new Date - this.generatedProjectIdTimestamp) < 1000)) {
  //         return
  //       }

  //       // call our callback function
  //       // when settings change!
  //       onSettingsChanged.call(this)
  //     },
  //   }

  //   if (options.configFile !== false) {
  //     this.watchers.watch(settings.pathToConfigFile(this.projectRoot, options), obj)
  //   }

  //   return this.watchers.watch(settings.pathToCypressEnvJsthis.projectRoot), obj)
  // }

  watchSettingsAndStartWebsockets (options: Record<string, unknown> = {}, cfg: Record<string, unknown> = {}) {
    // this.watchSettings(options.onSettingsChanged, options)

    const { projectRoot } = cfg
    let { reporter } = cfg as { reporter: RunnablesStore }

    // if we've passed down reporter
    // then record these via mocha reporter
    if (cfg.report) {
      try {
        Reporter.loadReporter(reporter, projectRoot)
      } catch (err) {
        const paths = Reporter.getSearchPathsForReporter(reporter, projectRoot)

        // only include the message if this is the standard MODULE_NOT_FOUND
        // else include the whole stack
        const errorMsg = err.code === 'MODULE_NOT_FOUND' ? err.message : err.stack

        errors.throw('INVALID_REPORTER_NAME', {
          paths,
          error: errorMsg,
          name: reporter,
        })
      }

      reporter = Reporter.create(reporter, cfg.reporterOptions, projectRoot)
    }

    // this.automation = Automation.create(cfg.namespace, cfg.socketIoCookie, cfg.screenshotsFolder)

    this.server.startWebsockets(cfg, {
      onReloadBrowser: options.onReloadBrowser,

      onFocusTests: options.onFocusTests,

      onSpecChanged: options.onSpecChanged,

      onSavedStateChanged: options.onSavedStateChanged,

      onCaptureVideoFrames: (data: unknown) => {
        // TODO: move this to browser automation middleware
        // @ts-ignore - this method deos not appear to exist or be used.
        this.emit('capture:video:frames', data)
      },

      onConnect: (id: number) => {
        // @ts-ignore - this method deos not appear to exist or be used.
        this.emit('socket:connected', id)
      },

      onSetRunnables (runnables: RootRunnable) {
        debug('received runnables %o', runnables)

        if (reporter != null) {
          reporter.setRunnables(runnables)
        }
      },

      onMocha: (event, runnable) => {
        debug('onMocha', event)
        // bail if we dont have a
        // reporter instance
        if (!reporter) {
          return
        }

        reporter.emit(event, runnable)

        if (event === 'end') {
          return Bluebird.all([
            (reporter != null ? reporter.end() : undefined),
            this.server.end(),
          ])
          .spread((stats = {}) => {
            this.emit('end', stats)
          })
        }
      },
    })
  }

  setCurrentSpecAndBrowser (spec, browser: Cypress.Browser) {
    this.spec = spec
    this.browser = browser
  }

  getCurrentSpecAndBrowser () {
    return _.pick(this, 'spec', 'browser')
  }

  getAutomation () {
    return {
      use () { },
    }
  }

  // returns project config (user settings + defaults + cypress.json)
  // with additional object "state" which are transient things like
  // window width and height, DevTools open or not, etc.
  getConfig (options = {}) {
    if (options == null) {
      options = this.options
    }

    if (this.cfg) {
      debug('project has config %o', this.cfg)

      return Bluebird.resolve(this.cfg)
    }

    return config.get(this.projectRoot, options)
    .then((cfg) => {
      return this._setSavedState(cfg)
    })
  }

  _setSavedState (cfg) {
    debug('get saved state')

    return savedState.create(this.projectRoot, cfg.isTextTerminal)
    .then((state) => state.get())
    .then((state) => {
      cfg.state = state

      return cfg
    })
  }

  getSpecUrl (absoluteSpecPath, specType) {
    debug('get spec url: %s for spec type %s', absoluteSpecPath, specType)

    return this.getConfig()
    .then((cfg) => {
      // if we don't have a absoluteSpecPath or its __all
      if (!absoluteSpecPath || (absoluteSpecPath === '__all')) {
        const url = this.normalizeSpecUrl(cfg.browserUrl, '/__all')

        debug('returning url to run all specs: %s', url)

        return url
      }

      // TODO:
      // to handle both unit + integration tests we need
      // to figure out (based on the config) where this absoluteSpecPath
      // lives. does it live in the integrationFolder or
      // the unit folder?
      // once we determine that we can then prefix it correctly
      // with either integration or unit
      const prefixedPath = this.getPrefixedPathToSpec(cfg, absoluteSpecPath, specType)
      const url = this.normalizeSpecUrl(cfg.browserUrl, prefixedPath)

      debug('return path to spec %o', { specType, absoluteSpecPath, prefixedPath, url })

      return url
    })
  }

  getPrefixedPathToSpec (cfg, pathToSpec, type = 'integration') {
    const { integrationFolder, componentFolder, projectRoot } = cfg

    // for now hard code the 'type' as integration
    // but in the future accept something different here

    // strip out the integration folder and prepend with "/"
    // example:
    //
    // /Users/bmann/Dev/cypress-app/.projects/cypress/integration
    // /Users/bmann/Dev/cypress-app/.projects/cypress/integration/foo.js
    //
    // becomes /integration/foo.js

    const folderToUse = type === 'integration' ? integrationFolder : componentFolder

    const url = `/${path.join(type, path.relative(
      folderToUse,
      path.resolve(projectRoot, pathToSpec),
    ))}`

    debug('prefixed path for spec %o', { pathToSpec, type, url })

    return url
  }

  normalizeSpecUrl (browserUrl, specUrl) {
    const replacer = (match) => match.replace('//', '/')

    return [
      browserUrl,
      '#/tests',
      escapeFilenameInUrl(specUrl),
    ].join('/').replace(multipleForwardSlashesRe, replacer)
  }

  getProjectId () {
    return this.verifyExistence()
    .then(() => {
      return settings.read(this.projectRoot, this.options)
    }).then((readSettings) => {
      if (readSettings && readSettings.projectId) {
        return readSettings.projectId
      }

      errors.throw('NO_PROJECT_ID', settings.configFile(this.options), this.projectRoot)
    })
  }

  verifyExistence () {
    return fs
    .statAsync(this.projectRoot)
    .return(this)
    .catch(() => {
      errors.throw('NO_PROJECT_FOUND_AT_PROJECT_ROOT', this.projectRoot)
    })
  }
}
