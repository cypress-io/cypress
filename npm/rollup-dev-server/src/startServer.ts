import Debug from 'debug'
import { StartDevServer } from '.'
import { resolve } from 'path'
import { makeCypressPlugin } from './makeHtmlPlugin'
import { RollupOptions, rollup } from 'rollup'
const debug = Debug('cypress:rollup-dev-server:start')
import NollupDevMiddleware from 'nollup/lib/dev-middleware'
import express from 'express'
import { createServer, IncomingMessage, ServerResponse } from 'http'

function resolveRollupConfig({ rollupOptions } : StartDevServer): RollupOptions {
  return {
    output: {
      format: 'es'
    },
    watch: {
    },
    ...rollupOptions
  }
}

async function bundle (filePath: string, options: RollupOptions): Promise<string> {
  try {
    const { generate } = await rollup({ ...options, input: resolve(filePath) })
    const bundle = await generate({
      // TODO: Figure out if we need to pass anything else here.
      format: 'es'
    })

    return bundle.output.reduce((acc, curr) => {
      if (curr.type === 'chunk') {
        return acc + curr.code
      } else {
        // TODO: Figure out how to handle assets
        throw Error(`TODO: Rollup Dev Server to handle non code assets`)
        return acc
      }
    }, '')
  } catch (e) {
    throw Error(e)
  }
}

export function start(devServerOptions: StartDevServer) {
  const resolvedConfig = resolveRollupConfig(devServerOptions)
  const contentBase = resolve(__dirname, devServerOptions.options.config.projectRoot)

  console.log(resolvedConfig)

  try {
    const app = express()
    const server = createServer(app)
    const config: Record<string, any> = {
      input: './index.js',
      output: {
        format: 'es'
      }  
    }
    const nollup = NollupDevMiddleware(app, config, {
      contentBase,
      port: 3000,
      // publicPath: '/__cypress/src/'
      publicPath: '/'
    }, server)
    app.use(nollup)
    makeCypressPlugin(
      devServerOptions.options.config.projectRoot,
      devServerOptions.options.config.supportFile,
      app
    )
    return server
  } catch (e) {
    console.log(e)
  }
}
  // const requestListener = async (req: IncomingMessage, res: ServerResponse) => {
  //   const output = await bundle(req.headers['__cypress_spec_path'] as string, resolvedConfig)

  //   return res.end(makeHtml({ output, projectRoot: '', supportFilePath: '' }))
  // }

  // return createServer(requestListener)
