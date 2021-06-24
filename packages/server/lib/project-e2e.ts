import Debug from 'debug'
import browsers from './browsers'
import preprocessor from './plugins/preprocessor'
import { ProjectBase } from './project-base'
import { ServerE2E } from './server-e2e'
import { SocketE2E } from './socket-e2e'
import { createRoutes } from './routes'

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
        .then(({ cfg, specsStore, startSpecWatcher }) => {
          return this.server.open(cfg, {
            project: this,
            onError: options.onError,
            onWarning: options.onWarning,
            shouldCorrelatePreRequests: this.shouldCorrelatePreRequests,
            projectType: 'e2e',
            SocketCtor: SocketE2E,
            createRoutes,
            specsStore,
          })
          .then(([port, warning]) => {
            return {
              cfg,
              port,
              warning,
              specsStore,
              startSpecWatcher,
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
