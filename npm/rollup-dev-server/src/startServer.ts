import Debug from 'debug'
import { StartDevServer } from '.'
import { resolve } from 'path'
import { makeCypressPlugin } from './makeHtmlPlugin'
import { RollupOptions, rollup } from 'rollup'
const debug = Debug('cypress:rollup-dev-server:start')
import NollupDevMiddleware from 'nollup/lib/dev-middleware'
import express from 'express'
import { createServer, IncomingMessage, ServerResponse } from 'http'

export function start(devServerOptions: StartDevServer) {
  const contentBase = resolve(__dirname, devServerOptions.options.config.projectRoot)

  try {
    const app = express()
    const server = createServer(app)
    const config: Record<string, any> = {
      input: './entry.js',
      output: {
        format: 'es',
        dir: 'dist',
        entryFileNames: '[name].[hash].js'
      }  
    }
    const nollup = NollupDevMiddleware(app, config, {
      contentBase,
      port: 3000,
      // publicPath: '/__cypress/src/'
      publicPath: '/',
      hot: true,
    }, server)

    app.use(nollup)

    makeCypressPlugin(
      devServerOptions.options.config.projectRoot,
      devServerOptions.options.config.supportFile,
      app
    )
    return server
  } catch (e) {
    console.log('ERROR')
  }
}
