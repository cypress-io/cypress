const _ = require('lodash')
const path = require('path')
const debug = require('debug')('cypress:server-ct:project')
const Bluebird = require('bluebird')

const specsUtil = require('@packages/server/lib/util/specs')
const config = require('@packages/server/lib/config')
const savedState = require('@packages/server/lib/saved_state')
const plugins = require('@packages/server/lib/plugins')
const Watchers = require('@packages/server/lib/watchers')

const fs = require('@packages/server/lib/util/fs')
const cwd = require('@packages/server/lib/cwd')
const settings = require('@packages/server/lib/util/settings')

const Server = require('./server-ct')

const localCwd = cwd()

class Project {
  constructor (projectRoot) {
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
      .then(({ port: webpackDevServerPort, modifiedCfg }) => {
        debug('plugin config yielded: %o', modifiedCfg)

        const updatedConfig = config.updateWithPluginValues(cfg, modifiedCfg)

        updatedConfig.webpackDevServerUrl = `http://localhost:${webpackDevServerPort}`


        debug('updated config: %o', updatedConfig)

        return updatedConfig
      })
    })
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

        return Bluebird.join(
          this.watchSettingsAndStartWebsockets(options, cfg),
          // this.scaffold(cfg),
        )
        .then(() => {
          return Bluebird.join(
            // this.checkSupportFile(cfg),
            this.watchPluginsFile(cfg, options),
          )
        })
      })
    })
    .return(this)
  }

  _initPlugins (cfg, options) {
    // only init plugins with the
    // allowed config values to
    // prevent tampering with the
    // internals and breaking cypress
    cfg = config.allowed(cfg)

    return plugins.init(cfg, {
      projectRoot: this.projectRoot,
      configFile: settings.pathToConfigFile(this.projectRoot, options),
    })
    .then((modifiedCfg) => {
      // now that plugins have been initialized, we want to execute
      // the plugin event for 'devserver:config' and get back

      return specsUtil.find(modifiedCfg)
      .filter((spec) => {
        return spec.specType === 'component'
      }).then((specs) => {
        return plugins.execute('devserver:config', { specs, config: modifiedCfg })
        .then((port) => {
          return { port, modifiedCfg }
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

    return Bluebird.join(
      this.server ? this.server.close() : undefined,
      this.watchers ? this.watchers.close() : undefined,
      // preprocessor.close(),
    )
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

  watchSettingsAndStartWebsockets (options = {}, cfg = {}) {
    // this.watchSettings(options.onSettingsChanged, options)

    let { reporter } = cfg

    // this.automation = Automation.create(cfg.namespace, cfg.socketIoCookie, cfg.screenshotsFolder)

    this.server.startWebsockets(cfg, {
      onReloadBrowser: options.onReloadBrowser,

      onFocusTests: options.onFocusTests,

      onSpecChanged: options.onSpecChanged,

      onSavedStateChanged: options.onSavedStateChanged,

      onCaptureVideoFrames: (data) => {
        // TODO: move this to browser automation middleware
        this.emit('capture:video:frames', data)
      },

      onConnect: (id) => {
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

module.exports = Project
