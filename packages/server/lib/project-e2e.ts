import Debug from 'debug'
import browsers from './browsers'
import preprocessor from './plugins/preprocessor'
import { ProjectBase } from './project-base'
import { ServerE2E } from './server-e2e'

const debug = Debug('cypress:server:project')

export class ProjectE2E extends ProjectBase<ServerE2E> {
  get projectType (): 'e2e' {
    return 'e2e'
  }

  async _initPlugins (cfg, options) {
    const modifiedConfig = await super._initPlugins(cfg, options)

    const { specsStore } = await this.initSpecListWatcher(modifiedConfig)

    return {
      cfg,
      specsStore,
    }
  }

  open (options: Record<string, unknown>) {
    this._server = new ServerE2E()

    return super.open(options, {
      // @ts-ignore
      onOpen: (cfg) => {
        return this._initPlugins(cfg, options)
        .then(({ cfg, specsStore }) => {
          return this.server.open(cfg, {
            onError: options.onError as any,
            onWarning: options.onWarning as any,
            project: this,
            shouldCorrelatePreRequests: this.shouldCorrelatePreRequests,
            specsStore,
          })
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

  close () {
    return super.close({
      onClose () {
        preprocessor.close()
      },
    })
  }
}
