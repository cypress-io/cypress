import Debug from 'debug'
import config from '@packages/server/lib/config'
import devServer from '@packages/server/lib/plugins/dev-server'
import { Cfg, ProjectBase } from '@packages/server/lib/project-base'
import specsUtil from '@packages/server/lib/util/specs'
import { ServerCt } from './server-ct'
import { SpecsStore } from './specs-store'

export * from '@packages/server/lib/project-base'

const debug = Debug('cypress:server-ct:project')

export class ProjectCt extends ProjectBase<ServerCt> {
  get projectType () {
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
    return super._initPlugins(cfg, options)
    .then((modifiedCfg) => {
      debug('plugin config yielded: %o', modifiedCfg)

      const updatedConfig = config.updateWithPluginValues(cfg, modifiedCfg)

      updatedConfig.componentTesting = true

      // This value is normally set up in the `packages/server/lib/plugins/index.js#110`
      // But if we don't return it in the plugins function, it never gets set
      // Since there is no chance that it will have any other value here, we set it to "component"
      // This allows users to not return config in the `cypress/plugins/index.js` file
      // https://github.com/cypress-io/cypress/issues/16860
      updatedConfig.resolved.testingType = { value: 'component' }

      debug('updated config: %o', updatedConfig)

      return updatedConfig
    })
    .then((modifiedConfig) => {
      // now that plugins have been initialized, we want to execute
      // the plugin event for 'dev-server:start' and get back
      // @ts-ignore - let's not attempt to TS all the things in packages/server

      return specsUtil.find(modifiedConfig)
      .filter((spec: Cypress.Cypress['spec']) => {
        return spec.specType === 'component'
      })
      .then((specs) => {
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

          const specsStore = new SpecsStore(cfg)

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
    })
  }
}
