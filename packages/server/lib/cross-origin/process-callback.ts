import { getFullWebpackOptions } from '@cypress/webpack-batteries-included-preprocessor'
import md5 from 'md5'
import { fs } from 'memfs'
import * as path from 'path'
import webpack from 'webpack'

const VirtualModulesPlugin = require('webpack-virtual-modules')

interface Options {
  file: string
  fn: string
}

// @ts-ignore - webpack expects `fs.join` to exist for some reason
fs.join = path.join

export const processCallback = ({ file, fn }: Options) => {
  const source = fn.replace(/Cypress\.require/g, 'require')
  const webpackOptions = getFullWebpackOptions(file, require.resolve('typescript'))

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
      new VirtualModulesPlugin({
        [inputPath]: source,
      }),
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1,
      }),
    ],
  }

  const compiler = webpack(modifiedWebpackOptions)

  // @ts-ignore
  compiler.outputFileSystem = fs

  return new Promise<string>((resolve, reject) => {
    const handle = (err: Error) => {
      if (err) {
        return reject(err)
      }

      // Using an in-memory file system, so the usual restrictions on sync
      // methods don't apply, since this won't throw an EMFILE error
      // eslint-disable-next-line no-restricted-syntax
      const result = fs.readFileSync(outputPath).toString()

      resolve(result)
    }

    compiler.run(handle)
  })
}
