import Debug from 'debug'
import { StartDevServer } from '.'
import resolvePlugin from '@rollup/plugin-node-resolve'
import commonjsPlugin from '@rollup/plugin-commonjs'
import { makeCypressPlugin } from './makeHtmlPlugin'
import http from 'http'
import { resolve } from 'path'
const debug = Debug('cypress:rollup-dev-server:start')
import NollupDevMiddleware from 'nollup/lib/dev-middleware'
import express from 'express'

export function start (devServerOptions: StartDevServer) {
  const contentBase = resolve(__dirname, devServerOptions.options.config.projectRoot)

  try {
    const app = express()
    const server = http.createServer(app)

    const config = devServerOptions.options.specs.map((spec) => {
      return {
        input: spec.absolute,
        plugins: [
          resolvePlugin(), commonjsPlugin(),
        ],
        output: {
          format: 'es',
          dir: 'dist',
          entryFileNames: '[name].js',
        },
      }
    })

    const nollup = NollupDevMiddleware(app, config, {
      contentBase,
      port: 3000,
      publicPath: '/', // /__cypress/src/',
      hot: true,
    }, server)

    app.use(nollup)

    makeCypressPlugin(
      devServerOptions.options.config.projectRoot,
      devServerOptions.options.config.supportFile,
      app,
    )

    return server
  } catch (e) {
    console.log('ERROR')
  }
}
