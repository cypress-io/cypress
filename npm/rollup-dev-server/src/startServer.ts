import Debug from 'debug'
import { StartDevServer } from '.'
import { makeCypressPlugin } from './makeHtmlPlugin'
import http from 'http'
import { resolve } from 'path'
import NollupDevMiddleware from 'nollup/lib/dev-middleware'
import express from 'express'
import { RollupOptions } from 'rollup'

const debug = Debug('cypress:rollup-dev-server:start')

export async function start (devServerOptions: StartDevServer) {
  const config = devServerOptions.options.specs
  .map<RollupOptions>((spec) => {
    return {
      ...devServerOptions.rollupConfig,
      input: spec.absolute,
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
