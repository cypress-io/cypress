import _ from 'lodash'
import Debug from 'debug'
import * as path from 'path'
import webpack from 'webpack'
import { CrossOriginCallbackStoreFile } from './cross-origin-callback-store'

const VirtualModulesPlugin = require('webpack-virtual-modules')

const debug = Debug('cypress:webpack')

const getConfig = ({ files, originalFilePath }) => {
  const dir = path.dirname(originalFilePath)

  return files.reduce((memo, file) => {
    const { inputFileName, source } = file
    const inputPath = path.join(dir, inputFileName)

    memo.entry[inputFileName] = inputPath
    memo.virtualConfig[inputPath] = source

    return memo
  }, { entry: {}, virtualConfig: {} })
}

const getWebpackOptions = ({ webpackOptions, entry, virtualConfig, outputDir }) => {
  const modifiedWebpackOptions = _.extend({}, webpackOptions, {
    entry,
    output: {
      path: outputDir,
    },
  })
  const plugins = modifiedWebpackOptions.plugins || []

  modifiedWebpackOptions.plugins = plugins.concat(
    new VirtualModulesPlugin(virtualConfig),
  )

  return modifiedWebpackOptions
}

interface CompileOptions {
  originalFilePath: string
  webpackOptions: webpack.Configuration
}

export const compileCrossOriginCallbackFiles = (files: CrossOriginCallbackStoreFile[], options: CompileOptions) => {
  debug('compile cross-origin callback files: %o', files)

  const { originalFilePath, webpackOptions } = options
  const outputDir = path.dirname(files[0].outputFilePath)
  const { entry, virtualConfig } = getConfig({ files, originalFilePath })
  const modifiedWebpackOptions = getWebpackOptions({
    webpackOptions,
    entry,
    virtualConfig,
    outputDir,
  })

  return new Promise((resolve, reject) => {
    const compiler = webpack(modifiedWebpackOptions)

    const handle = (err: Error) => {
      if (err) {
        debug('errored compiling cross-origin callback files with: %s', err.stack)

        return reject(err)
      }

      debug('successfully compiled cross-origin callback files')

      resolve(outputDir)
    }

    compiler.run(handle)
  })
}
