import md5 from 'md5'
import { fs } from 'memfs'
import path from 'path'
import webpack from 'webpack'
import VirtualModulesPlugin from 'webpack-virtual-modules'
import * as resolve from '../../util/resolve'
import type { CrossOriginCallbackArgs } from './types'

export const processCallback = ({ file, fn, projectRoot }: CrossOriginCallbackArgs): Promise<string> => {
  const { getFullWebpackOptions } = require('@cypress/webpack-batteries-included-preprocessor')

  const source = fn.replace(/Cypress\.require/g, 'require')
  const typescriptPath = resolve.typescript(projectRoot)
  const webpackOptions = getFullWebpackOptions(file, typescriptPath)

  const inputFileName = md5(source)
  const inputDir = path.dirname(file)
  const inputPath = path.join(inputDir, inputFileName)
  const outputDir = '/'
  const outputFileName = 'output'
  const outputPath = `${outputDir}${outputFileName}.js`

  const modifiedWebpackOptions = {
    ...webpackOptions,
    entry: {
      [outputFileName]: inputPath,
    },
    output: {
      path: outputDir,
    },
    plugins: [
      // Preserve the default plugins (notably `webpack.ProvidePlugin`, which
      // shims the `process` and `Buffer` globals). Without them, dependencies
      // that reference a bare `process` throw "process is not defined" once the
      // bundled callback runs in the browser.
      ...(webpackOptions.plugins || []),
      new VirtualModulesPlugin({
        [inputPath]: source,
      }),
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1,
      }),
    ],
  }

  const compiler = webpack(modifiedWebpackOptions)

  // memfs is compatible at runtime but its types don't match webpack's OutputFileSystem
  compiler.outputFileSystem = fs as unknown as webpack.Compiler['outputFileSystem']

  return new Promise((resolvePromise, reject) => {
    const handle = (err?: Error | null) => {
      if (err) {
        return reject(err)
      }

      // this won't throw an EMFILE error since it's using an in-memory file
      // system, so the usual restrictions on sync methods don't apply
      // eslint-disable-next-line no-restricted-syntax
      const result = fs.readFileSync(outputPath).toString()

      resolvePromise(result)
    }

    compiler.run(handle)
  })
}
