import Debug from 'debug'
import browsers from './browsers'
import config from './config'
import plugins from './plugins'
import preprocessor from './plugins/preprocessor'
import { ProjectBase } from './project-base'
import { ServerE2E } from './server-e2e'
import settings from './util/settings'

const debug = Debug('cypress:server:project')

export class ProjectE2E extends ProjectBase<ServerE2E> {
  get projectType () {
    return 'e2e'
  }

  open (options) {
    this._server = new ServerE2E()

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
          .then(([port, warning]) => {
            return {
              cfg,
              port,
              warning,
            }
          })
        })
      },

      onAfterOpen ({ cfg }) {
        cfg.proxyServer = cfg.proxyUrl

        return cfg
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
