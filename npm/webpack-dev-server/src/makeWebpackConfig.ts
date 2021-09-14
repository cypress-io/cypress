import { debug as debugFn } from 'debug'
import * as path from 'path'
import * as webpack from 'webpack'
import * as fs from 'fs'
import { merge } from 'webpack-merge'
import makeDefaultWebpackConfig from './webpack.config'
import CypressCTOptionsPlugin, { CypressCTOptionsPluginOptionsWithEmitter } from './plugin'

const debug = debugFn('cypress:webpack-dev-server:makeWebpackConfig')

const removeList = ['HtmlWebpackPlugin', 'PreloadPlugin', 'HtmlPwaPlugin']

export interface UserWebpackDevServerOptions {
  /**
   * if `true` will compile all the specs together when the first one is request and can slow up initial build time.
   * @default false
  */
  disableLazyCompilation?: boolean
}

interface MakeWebpackConfigOptions extends CypressCTOptionsPluginOptionsWithEmitter, UserWebpackDevServerOptions {
  devServerPublicPathRoute: string
  isOpenMode: boolean
  template?: string
}

const OsSeparatorRE = RegExp(`\\${path.sep}`, 'g')
const posixSeparator = '/'

export async function makeWebpackConfig (userWebpackConfig: webpack.Configuration, options: MakeWebpackConfigOptions): Promise<webpack.Configuration> {
  const { projectRoot, devServerPublicPathRoute, files, supportFile, devServerEvents, template, preview } = options

  debug(`User passed in webpack config with values %o`, userWebpackConfig)

  debug(`New webpack entries %o`, files)
  debug(`Project root`, projectRoot)
  debug(`Support file`, supportFile)

  const entry = path.resolve(__dirname, './browser.js')
  const publicPath = (path.sep === posixSeparator)
    ? path.join(devServerPublicPathRoute, posixSeparator)
    // The second line here replaces backslashes on windows with posix compatible slash
    // See https://github.com/cypress-io/cypress/issues/16097
    : path.join(devServerPublicPathRoute, posixSeparator)
    .replace(OsSeparatorRE, posixSeparator)

  const dynamicWebpackConfig = {
    output: {
      publicPath,
    },
    plugins: [
      new CypressCTOptionsPlugin({
        files,
        projectRoot,
        devServerEvents,
        supportFile,
        preview,
      }),
    ],
  }

  // certain plugins conflict with HtmlWebpackPlugin and cause
  // problems for some setups.
  // most of these are application optimizations that are not relevant in a
  // testing environment.
  // remove those plugins to ensure a smooth configuration experience.
  // we provide a webpack-html-plugin config pinned to a specific version (4.x)
  // that we have tested and are confident works with all common configurations.
  // https://github.com/cypress-io/cypress/issues/15865
  if (userWebpackConfig?.plugins) {
    userWebpackConfig.plugins = userWebpackConfig.plugins.filter((plugin) => {
      if (removeList.includes(plugin.constructor.name)) {
        /* eslint-disable no-console */
        console.warn(`[@cypress/webpack-dev-server]: removing ${plugin.constructor.name} from configuration.`)

        return false
      }

      return true
    })
  }

  // This should be moved into @cypress/react
  let htmlHeadSnippet = ''
  const storybookPreviewHeadPath = path.resolve(options.projectRoot, '.storybook', 'preview-head.html')
  const cypressPreviewHeadPath = path.resolve(options.projectRoot, 'cypress', 'support', 'preview-head.html')

  if (fs.existsSync(cypressPreviewHeadPath)) {
    console.log('Found preview-head.html at: ', cypressPreviewHeadPath)
    htmlHeadSnippet = fs.readFileSync(cypressPreviewHeadPath).toString('utf-8')
  } else if (fs.existsSync(storybookPreviewHeadPath)) {
    console.log('Found preview-head.html at: ', storybookPreviewHeadPath)
    htmlHeadSnippet = fs.readFileSync(storybookPreviewHeadPath).toString('utf-8')
  }

  const mergedConfig = merge<webpack.Configuration>(
    userWebpackConfig,
    makeDefaultWebpackConfig(template, htmlHeadSnippet),
    dynamicWebpackConfig,
  )

  // // @ts-ignore
  // const babelRule = mergedConfig.module.rules
  //   // @ts-ignore
  //   .find((rule) => !!rule.oneOf)
  // // @ts-ignore
  //   .oneOf.find(
  // // @ts-ignore
  //     (loaderConfig) =>
  //       typeof loaderConfig.loader === "string" &&
  //       loaderConfig.loader.includes("babel-loader") &&
  //       !!loaderConfig.include
  //   );
  // babelRule.include.push(path.resolve(__dirname));
  // console.log(babelRule.include)

  mergedConfig.entry = entry

  debug('Merged webpack config %o', mergedConfig)

  if (process.env.WEBPACK_PERF_MEASURE) {
    // only for debugging
    const { measureWebpackPerformance } = require('./measureWebpackPerformance')

    return measureWebpackPerformance(mergedConfig)
  }

  return mergedConfig
}
