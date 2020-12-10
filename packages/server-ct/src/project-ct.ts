import _ from 'lodash'
import path from 'path'
import _debug from 'debug'
const debug = _debug('cypress:server-ct:project')
import Bluebird from 'bluebird'

import specsUtil from '@packages/server/lib/util/specs'
import config from '@packages/server/lib/config'
import savedState from '@packages/server/lib/saved_state'
import plugins from '@packages/server/lib/plugins'
import devserver from '@packages/server/lib/plugins/devserver'
import { SpecsController } from './specs-controller'
import Watchers from '@packages/server/lib/watchers'
import browsers from '@packages/server/lib/browsers'

import fs from '@packages/server/lib/util/fs'
import cwd from '@packages/server/lib/cwd'
import settings from '@packages/server/lib/util/settings'

import Server from './server-ct'

const localCwd = cwd()

const DEFAULT_BROWSER_NAME = 'chrome'

export default class Project {
  private projectRoot: string
  private watchers: Watchers
  private cfg: any
  private server: Server
  private options: Record<string, any>
  private spec: Cypress.Cypress['spec']
  private browser: any
  private automation: any

  constructor (projectRoot: string) {
    if (!(this instanceof Project)) {
      return new Project(projectRoot)
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
      .then((cfg) => {
        // return this.server.open(cfg, this, options.onError, options.onWarning)
        return this.server.open(cfg, this)
        .spread((port, warning) => {
          // if we didnt have a cfg.port
          // then get the port once we
          // open the server

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
      if (modifiedCfg.browsers.length) {
        return Promise.resolve(modifiedCfg)
      }

      // add chrome as a default browser if none has been specified
      return browsers.ensureAndGetByNameOrPath(DEFAULT_BROWSER_NAME).then((browser) => {
        modifiedCfg.browsers = [browser]

        return modifiedCfg
      })
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
      // the plugin event for 'devserver:config' and get back
      // @ts-ignore - let's not attempt to TS all the things in packages/server
      return specsUtil.find(modifiedConfig)
      .filter((spec: Cypress.Cypress['spec']) => {
        return spec.specType === 'component'
      }).then((specs) => {
        return devserver.start({ specs, config: modifiedConfig })
        .then((port) => {
          const specs = new SpecsController(cfg, {
            onSpecListChanged: (specs: Cypress.Cypress['spec'][]) => {
              // send new files to dev server
              devserver.updateSpecs(specs)

              // send new files to frontend
              this.server.sendSpecList(specs)
            },
          })

          specs.watch()

          modifiedConfig.webpackDevServerUrl = `http://localhost:${port}`

          return modifiedConfig
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

    let { reporter } = cfg

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

      onSetRunnables (runnables) {
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
            // @ts-ignore - this method deos not appear to exist
            this.emit('end', stats)
          })
        }
      },
    })
  }

  setCurrentSpecAndBrowser (spec, browser) {
    this.spec = spec
    this.browser = browser
  }

  getCurrentSpecAndBrowser () {
    return _.pick(this, 'spec', 'browser')
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
}
