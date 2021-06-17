import Debug from 'debug'
import { Cfg, ProjectBase } from '@packages/server/lib/project-base'
import { ServerCt } from './server-ct'
import { createRoutes } from './routes-ct'

export * from '@packages/server/lib/project-base'

const debug = Debug('cypress:server-ct:project')

export class ProjectCt extends ProjectBase<ServerCt> {
  get projectType (): 'ct' {
    return 'ct'
  }

  /**
   * override default viewport for component testing
   * 1. if user specified viewport values in their cypress.json, use those.
   * 2. otherwise, use 500/500 by default.
   */
  addComponentTestingUniqueDefaults (cfg: Record<string, unknown>) {
    const rawJson = cfg.rawJson as Cfg

    return {
      ...cfg,
      viewportHeight: rawJson.viewportHeight ?? 500,
      viewportWidth: rawJson.viewportWidth ?? 500,
    }
  }

  changeToUrl (targetUrl: string) {
    this.server.socket.changeToUrl(targetUrl)
  }

  open (options: Record<string, unknown>) {
    this._server = new ServerCt()

    return super.open(options, {
      onOpen: (cfg) => {
        const cfgForComponentTesting = this.addComponentTestingUniqueDefaults(cfg)

        return this._initPlugins(cfgForComponentTesting, options)
        .then(({ cfg, specsStore, startSpecWatcher }) => {
          return this.server.open(cfg, {
            specsStore,
            onError: options.onError,
            onWarning: options.onWarning,
            shouldCorrelatePreRequests: this.shouldCorrelatePreRequests,
            project: this,
            projectType: 'ct',
            createRoutes,
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
    debug('plugins failed with error', err)

    options.onError(err)
  }

  _initPlugins (cfg, options) {
    // only init plugins with the
    // allowed config values to
    // prevent tampering with the
    // internals and breaking cypress
    return super._initPlugins(cfg, options)
  }
}
