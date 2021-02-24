import Debug from 'debug'
import { StartDevServer } from '.'
import { resolve } from 'path'
import { makeHtml } from './makeHtmlPlugin'
import { RollupOptions, rollup } from 'rollup'
const debug = Debug('cypress:rollup-dev-server:start')

import { createServer, IncomingMessage, ServerResponse } from 'http'

function resolveRollupConfig({ rollupOptions } : StartDevServer): RollupOptions {
  return {
    output: {
      format: 'es'
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

export async function start (devServerOptions: StartDevServer): Promise<any> {
  const resolvedConfig = resolveRollupConfig(devServerOptions)

  const requestListener = async (req: IncomingMessage, res: ServerResponse) => {
    const output = await bundle(req.headers['__cypress_spec_path'] as string, resolvedConfig)

    return res.end(makeHtml({ output, projectRoot: '', supportFilePath: '' }))
  }

  return createServer(requestListener)
}
