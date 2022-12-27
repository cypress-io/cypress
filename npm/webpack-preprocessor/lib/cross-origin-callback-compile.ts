import _ from 'lodash'
import Debug from 'debug'
import * as path from 'path'
import webpack from 'webpack'
import { CrossOriginCallbackStoreFile } from './cross-origin-callback-store'

const VirtualModulesPlugin = require('webpack-virtual-modules')

const debug = Debug('cypress:webpack')

interface Entry {
  [key: string]: string
}

interface VirtualConfig {
  [key: string]: string
}

interface EntryConfig {
  entry: Entry
  virtualConfig: VirtualConfig
}

// takes the files stored by the cross-origin-callback-loader and turns
// them into config we can pass to webpack to compile all the files. the
// virtual config allows us to just use the source we have in memory without
// needing to write it to file
const getConfig = ({ files, originalFilePath }): EntryConfig => {
  const dir = path.dirname(originalFilePath)

  return files.reduce((memo, file) => {
    const { inputFileName, source } = file
    const inputPath = path.join(dir, inputFileName)

    memo.entry[inputFileName] = inputPath
    memo.virtualConfig[inputPath] = source

    return memo
  }, { entry: {}, virtualConfig: {} })
}

interface ConfigProperties {
  webpackOptions: webpack.Configuration
  entry: Entry
  virtualConfig: VirtualConfig
  outputDir: string
}

const getWebpackOptions = ({ webpackOptions, entry, virtualConfig, outputDir }: ConfigProperties): webpack.Configuration => {
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

// the cross-origin-callback-loader extracts any cy.origin() callback functions
// that includes dependencies and stores their sources in the
// CrossOriginCallbackStore. this sends those sources through webpack again
// to process any dependencies and create bundles for each callback function
export const compileCrossOriginCallbackFiles = (files: CrossOriginCallbackStoreFile[], options: CompileOptions): Promise<void> => {
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

  return new Promise<void>((resolve, reject) => {
    const compiler = webpack(modifiedWebpackOptions)

    const handle = (err: Error) => {
      if (err) {
        debug('errored compiling cross-origin callback files with: %s', err.stack)

        return reject(err)
      }

      debug('successfully compiled cross-origin callback files')

      resolve()
    }

    compiler.run(handle)
  })
}
