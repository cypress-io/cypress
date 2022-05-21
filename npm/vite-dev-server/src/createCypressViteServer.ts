import type { OutputChunk, RollupOutput } from 'rollup'
import type { InlineConfig } from 'vite'
import type { ViteDevServerConfig } from './devServer'
import type { Vite } from './getVite'
import fs from 'fs/promises'
import http from 'http'
import { CypressViteErrorPlugin } from './plugins/CypressViteErrorPlugin'
import debugFn from 'debug'
import path from 'path'

const debug = debugFn('cypress:vite-dev-server:createCypressViteServer')

export const createCypressViteServer = async (devServerConfig: ViteDevServerConfig, config: InlineConfig, vite: Vite) => {
  const root = `${devServerConfig.cypressConfig.projectRoot}/node_modules/.cypress/vite-dev-server`

  const rollupOutput = await vite.build({
    mode: 'development',
    build: {
      outDir: root,
      rollupOptions: {
        input: config.optimizeDeps?.entries,
        plugins: [CypressViteErrorPlugin(devServerConfig)],
      },
      // TODO: What other options are needed? These maybe?
      // sourcemap: true,
      // minify: false,
      // commonjsOptions: {
      //   transformMixedEsModules: true,
      //   ...config.build?.commonjsOptions || {},
      // },
    },
    ...config,
  }) as RollupOutput

  return http.createServer(async function (request, response) {
    let filePath = config.base && request.url?.startsWith(config.base) ? request.url?.substring(config.base.length) : request.url || ''

    debug('request received: %o', { root,
      base: config.base,
      projectRoot: devServerConfig.cypressConfig.projectRoot,
      indexHtmlFile: devServerConfig.cypressConfig.indexHtmlFile,
      url: request.url, filePath,
    })

    const chunk = (rollupOutput.output as OutputChunk[]).find((outputChunk) => {
      if (outputChunk.isEntry) {
        return outputChunk.facadeModuleId === path.join(devServerConfig.cypressConfig.projectRoot, filePath) || outputChunk.facadeModuleId === `${path.join(devServerConfig.cypressConfig.projectRoot, filePath)}-ERROR`
      }

      return path.basename(outputChunk.fileName) === path.basename(filePath)
    })

    if (!chunk) {
      response.writeHead(404, { 'Content-Type': 'text/html' })
      response.end(`<h1>404</h1>${filePath}`, 'utf-8')

      return
    }

    const actualFilePath = path.join(root, chunk.fileName)

    debug('actual file path %s', actualFilePath)

    try {
      const content = await fs.readFile(actualFilePath)

      if (/\.[tj]sx?$/.test(filePath)) {
        response.writeHead(200, { 'Content-Type': 'application/javascript' })
      } else {
        response.writeHead(200)
      }

      response.end(content, 'utf-8')
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        response.writeHead(404, { 'Content-Type': 'text/html' })
        response.end(`<h1>404</h1>${actualFilePath}`, 'utf-8')
      } else {
        response.writeHead(500)
        response.end(`Could not load ${actualFilePath}. Error code: ${error.code} ..\n`)
      }
    }
  })
}
