import Debug from 'debug'
import devServer from '@packages/server/lib/plugins/dev-server'
import { Cfg, ProjectBase } from '@packages/server/lib/project-base'
import { ServerCt } from './server-ct'
import { SpecsStore } from '@packages/server/lib/specs-store'

export * from '@packages/server/lib/project-base'

const debug = Debug('cypress:server-ct:project')

interface InitPlugins {
  cfg: any
  specsStore: SpecsStore
}

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
      // @ts-ignore - Bluebird is giving me grief.
      onOpen: (cfg) => {
        return this._initPlugins(cfg, options)
        .then(({ cfg, specsStore }) => {
          return this.server.open(cfg, {
            specsStore,
            project: this,
            onError: options.onError as any,
            onWarning: options.onWarning as any,
            shouldCorrelatePreRequests: this.shouldCorrelatePreRequests,
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
    debug('plugins failed with error', err)

    options.onError(err)
  }

  async _initPlugins (cfg, options): Promise<InitPlugins> {
    let modifiedConfig = await super._initPlugins(cfg, options)
    const specs = await this.findProjectSpecs(modifiedConfig)
    const devServerOptions = await devServer.start({ specs, config: modifiedConfig })

    if (!devServerOptions) {
      throw new Error([
        'It looks like nothing was returned from on(\'dev-server:start\', {here}).',
        'Make sure that the dev-server:start function returns an object.',
        'For example: on("dev-server:star", () => startWebpackDevServer({ webpackConfig }))',
      ].join('\n'))
    }

    const { port } = devServerOptions

    modifiedConfig.baseUrl = `http://localhost:${port}`
    modifiedConfig = this.addComponentTestingUniqueDefaults(modifiedConfig)

    const specsStore = new SpecsStore(cfg, 'ct')

    specsStore.watch({
      onSpecsChanged: (specs) => {
        // send new files to dev server
        devServer.updateSpecs(specs)

        // send new files to frontend
        this.server.sendSpecList(specs)
      },
    })

    await specsStore.storeSpecFiles()

    return {
      specsStore,
      cfg: modifiedConfig,
    }
  }
}
