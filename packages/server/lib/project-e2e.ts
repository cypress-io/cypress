import Debug from 'debug'
import browsers from './browsers'
import config from './config'
import preprocessor from './plugins/preprocessor'
import { ProjectBase } from './project-base'
import { ServerE2E } from './server-e2e'

const debug = Debug('cypress:server:project')

export class ProjectE2E extends ProjectBase<ServerE2E> {
  get projectType (): 'e2e' {
    return 'e2e'
  }

  open (options: Record<string, unknown>) {
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
          return this.server.open(cfg, this, options.onError, options.onWarning, this.shouldCorrelatePreRequests)
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

  _onError<Options extends Record<string, any>> (err: Error, options: Options) {
    debug('got plugins error', err.stack)

    browsers.close()

    options.onError(err)
  }

  _initPlugins (cfg, options) {
    return super._initPlugins(cfg, options)
  }

  close () {
    return super.close({
      onClose () {
        preprocessor.close()
      },
    })
  }
}
