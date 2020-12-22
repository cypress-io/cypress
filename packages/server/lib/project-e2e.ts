import Debug from 'debug'
import browsers from './browsers'
import config from './config'
import plugins from './plugins'
import preprocessor from './plugins/preprocessor'
import { ProjectBase } from './project-base'
import { Server } from './server'
import settings from './util/settings'

const debug = Debug('cypress:server:project')

export class ProjectE2E extends ProjectBase {
  get projectType () {
    return 'e2e'
  }

  open (options = {}) {
    this.server = new Server()

    return super.open(options, {
      onOpen: (cfg) => {
        return this._initPlugins(cfg, options)
        .then((modifiedCfg) => {
          debug('plugin config yielded: %o', modifiedCfg)

          const updatedConfig = config.updateWithPluginValues(cfg, modifiedCfg)

          debug('updated config: %o', updatedConfig)

          return updatedConfig
        })
        .then((cfg) => {
          return this.server.open(cfg, this, options.onError, options.onWarning)
          .spread((port, warning) => {
            return {
              cfg,
              port,
              warning,
            }
          })
        })
      },
    })
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
      onError (err) {
        debug('got plugins error', err.stack)

        browsers.close()

        options.onError(err)
      },
      onWarning: options.onWarning,
    })
  }

  close () {
    return super.close({
      onClose () {
        preprocessor.close()
      },
    })
  }
}
