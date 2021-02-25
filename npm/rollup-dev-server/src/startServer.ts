import Debug from 'debug'
import { StartDevServer } from '.'
import { makeCypressPlugin } from './makeHtmlPlugin'
import http from 'http'
import { resolve } from 'path'
import NollupDevMiddleware from 'nollup/lib/dev-middleware'
import express from 'express'
import { RollupOptions, Plugin } from 'rollup'

const debug = Debug('cypress:rollup-dev-server:start')

function myPlugin (): Plugin {
  return {
    name: 'MyPlugin',
    transform: (code, id) => {
      return {
        // inject HMR runtime
        // TODO: see if this ruins the source map
        code: `
          if (module) {
            module.hot.accept(() => {
              window.location.reload()
            })
          }

          ${code}
        `,
      }
    },
  }
}

export async function start (devServerOptions: StartDevServer) {
  const config = devServerOptions.options.specs
  .map<RollupOptions>((spec) => {
    return {
      ...devServerOptions.rollupConfig,
      input: spec.absolute,
      plugins: devServerOptions.rollupConfig.plugins.concat(
        myPlugin(),
      ),
    }
  })

  const app = express()
  const server = http.createServer(app)
  const contentBase = resolve(__dirname, devServerOptions.options.config.projectRoot)

  const nollup = NollupDevMiddleware(app, config, {
    contentBase,
    port: 3000,
    publicPath: '/',
    hot: true,
  }, server)

  app.use(nollup)

  makeCypressPlugin(
    devServerOptions.options.config.projectRoot,
    devServerOptions.options.config.supportFile,
    app,
  )

  return server
}
