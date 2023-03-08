const md5 = require('md5')
const { fs } = require('memfs')
const path = require('path')
const webpack = require('webpack')
const VirtualModulesPlugin = require('webpack-virtual-modules')

const resolve = require('../../util/resolve')

fs.join = path.join

const processCallback = ({ file, fn, projectRoot }) => {
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
      new VirtualModulesPlugin({
        [inputPath]: source,
      }),
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1,
      }),
    ],
  }

  const compiler = webpack(modifiedWebpackOptions)

  compiler.outputFileSystem = fs

  return new Promise((resolve, reject) => {
    const handle = (err) => {
      if (err) {
        return reject(err)
      }

      // this won't throw an EMFILE error since it's using an in-memory file
      // system, so the usual restrictions on sync methods don't apply
      // eslint-disable-next-line no-restricted-syntax
      const result = fs.readFileSync(outputPath).toString()

      resolve(result)
    }

    compiler.run(handle)
  })
}

module.exports = {
  processCallback,
}
