import { debug as debugFn } from 'debug'
import * as path from 'path'
import { merge } from 'webpack-merge'
import CypressCTOptionsPlugin from '@packages/webpack-plugin-ct/dist/plugin'

const debug = debugFn('cypress:evergreen:webpack')

export async function makeWebpackConfig (userWebpackConfig = {}, { projectRoot, files, support }) {
  debug(`User passed in webpack config with values`, userWebpackConfig)

  const defaultWebpackConfig = require('./webpack.config')

  debug(`Merging Evergreen's webpack config with users'`)

  debug(`Support files`, support)

  debug(`New webpack entries`, files)

  // TODO: Add plugin

  // TODO: hook up to entry point? where will aut webpack entry live?
  //   const entry = path.resolve(__dirname, '../../plugins/webpack-client.js')

  //   debug({ entry })

  // TODO: webpack-plugin-ct, loader? idk
  //   const entryValLoader = {
  //     test: /bundle-specs.js$/,
  //     use: [
  //       {
  //         loader: 'val-loader',
  //         options: {
  //           support,
  //           files,
  //           projectRoot,
  //         },
  //       },
  //     ],
  //   }

  const entry = path.resolve(__dirname, './browser.js')

  const dynamicWebpackConfig = {
    entry,
    plugins: [
      new CypressCTOptionsPlugin({
        files,
        support,
        projectRoot
      })
    ],
    // module: {
    //   rules: [
    //     // entryValLoader,
    //   ],
    // },
  }

  const mergedConfig = merge(userWebpackConfig, defaultWebpackConfig, dynamicWebpackConfig)

  //   mergedConfig.entry = { entry }

  return mergedConfig
}
