import type { Compiler, Compilation } from 'webpack'
import * as fs from 'fs/promises'
import * as path from 'path'
import type { CreateFinalWebpackConfig } from './createWebpackDevServer'

const extensionRegexp = /\.(css|js|mjs)(\?|$)/

export class CypressIndexHtmlWebpackPlugin {
  private webpack = this.config.sourceWebpackModulesResult.webpack.module as any

  constructor (public config: CreateFinalWebpackConfig, public publicPath: string) {}

  apply (compiler: Compiler): void {
    if (this.config.sourceWebpackModulesResult.webpack.majorVersion === 4) {
      compiler.hooks.emit.tapAsync('CypressIndexHtmlWebpackPlugin', async (compilation, callback) => {
        const htmlContent = await this.transformEntryPoints(compilation, compiler)

        const assets = compilation.assets as any

        assets['index.html'] = {
          source: () => htmlContent,
          size: () => htmlContent.length,
        }

        callback()
      })
    } else {
      compiler.hooks.thisCompilation.tap('CypressIndexHtmlWebpackPlugin', (compilation) => {
        compilation.hooks.processAssets.tapPromise({ name: 'CypressIndexHtmlWebpackPlugin' }, async (assets) => {
          const htmlContent = await this.transformEntryPoints(compilation, compiler)
          const htmlSource = new this.webpack.sources.RawSource(htmlContent)

          assets['index.html'] = htmlSource
        })
      })
    }
  }

  private async transformEntryPoints (compilation: Compilation, compiler: Compiler): Promise<string> {
    const entryNames = Array.from(compilation.entrypoints.keys())
    const entryPointPublicPaths: string[] = []

    for (const entryName of entryNames) {
      const entryPointFiles = compilation.entrypoints.get(entryName)?.getFiles() || []
      const publicPaths = entryPointFiles
      .map((chunkFile) => this.publicPath + urlEncodePath(chunkFile))
      .filter((file) => extensionRegexp.test(file))

      entryPointPublicPaths.push(...publicPaths)
    }

    const indexHtmlContent = await this.getIndexContent(compilation, compiler)
    const entryPointScriptTags = entryPointPublicPaths.map((entryPath) => `<script defer src="${entryPath}"></script>`).join('')
    const indexContentWithScripts = indexHtmlContent.replace(/<\/head>/, `${entryPointScriptTags}</head>`)

    return indexContentWithScripts
  }

  private async getIndexContent (compilation: Compilation, compiler: Compiler): Promise<string> {
    const indexHtmlFilePath = path.resolve(compiler.context, this.config.devServerConfig.cypressConfig.indexHtmlFile)

    compilation.fileDependencies.add(indexHtmlFilePath)

    return fs.readFile(indexHtmlFilePath, 'utf-8')
  }
}

function urlEncodePath (filePath: string) {
  // People use the filepath in quite unexpected ways.
  // Try to extract the first querystring of the url:
  //
  // some+path/demo.html?value=abc?def
  //
  const queryStringStart = filePath.indexOf('?')
  const urlPath = queryStringStart === -1 ? filePath : filePath.substr(0, queryStringStart)
  const queryString = filePath.substr(urlPath.length)
  // Encode all parts except '/' which are not part of the querystring:
  const encodedUrlPath = urlPath.split('/').map(encodeURIComponent).join('/')

  return encodedUrlPath + queryString
}
