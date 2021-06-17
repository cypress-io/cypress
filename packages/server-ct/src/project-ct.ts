import Debug from 'debug'
import devServer from '@packages/server/lib/plugins/dev-server'
import { Cfg, ProjectBase } from '@packages/server/lib/project-base'
import { SpecsStore } from '@packages/server/lib/specs-store'
import { ServerCt } from './server-ct'

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
        .then(({ cfg, specsStore }) => {
          return this.server.open(cfg, specsStore, this, options.onError, options.onWarning, this.shouldCorrelatePreRequests)
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
    debug('plugins failed with error', err)

    options.onError(err)
  }

  _initPlugins (cfg, options) {
    // only init plugins with the
    // allowed config values to
    // prevent tampering with the
    // internals and breaking cypress
    return super._initPlugins(cfg, options)
    .then(({ specs, cfg: modifiedConfig }) => {
      return devServer.start({ specs, config: modifiedConfig })
      .then((devServerOptions) => {
        if (!devServerOptions) {
          throw new Error([
            'It looks like nothing was returned from on(\'dev-server:start\', {here}).',
            'Make sure that the dev-server:start function returns an object.',
            'For example: on("dev-server:star", () => startWebpackDevServer({ webpackConfig }))',
          ].join('\n'))
        }

        const { port } = devServerOptions

        modifiedConfig.baseUrl = `http://localhost:${port}`

        const specsStore = new SpecsStore(cfg, 'ct')

        specsStore.watch({
          onSpecsChanged: (specs) => {
            // send new files to dev server
            devServer.updateSpecs(specs)

            // send new files to frontend
            this.server.sendSpecList(specs)
          },
        })

        return specsStore.storeSpecFiles()
        .return({
          specsStore,
          cfg: modifiedConfig,
        })
      })
    })
  }
}
