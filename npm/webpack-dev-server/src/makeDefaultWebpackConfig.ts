import path from 'path'
import debugLib from 'debug'
import type { Configuration } from 'webpack'
import type { CreateFinalWebpackConfig } from './createWebpackDevServer'
import { CypressCTWebpackPlugin } from './CypressCTWebpackPlugin'

const debug = debugLib('cypress:webpack-dev-server:makeDefaultWebpackConfig')

const OUTPUT_PATH = path.join(__dirname, 'dist')

const OsSeparatorRE = RegExp(`\\${path.sep}`, 'g')
const posixSeparator = '/'

export function makeCypressWebpackConfig (
  config: CreateFinalWebpackConfig,
): Configuration {
  const {
    devServerConfig: {
      cypressConfig: {
        baseUrl,
        experimentalJustInTimeCompile,
        port,
        projectRoot,
        devServerPublicPathRoute,
        supportFile,
        indexHtmlFile,
        isTextTerminal: isRunMode,
      },
      specs: files,
      devServerEvents,
      framework,
    },
    sourceWebpackModulesResult: {
      webpack: {
        module: webpack,
        majorVersion: webpackMajorVersion,
      },
      htmlWebpackPlugin: {
        module: HtmlWebpackPlugin,
        majorVersion: htmlWebpackPluginVersion,
        importPath: htmlWebpackPluginImportPath,
      },
      webpackDevServer: {
        majorVersion: webpackDevServerMajorVersion,
      },
    },
  } = config

  let webpackDevServerPort: number | string | undefined = port ?? undefined

  // if experimentalJITComponentTesting is enabled, we can imply that the base URL is set to the url with the expected port.
  // start the dev server on the port specified in the base URL.
  if (experimentalJustInTimeCompile && isRunMode) {
    try {
      // if the baseUrl is null, something critically wrong has occurred...
      // @ts-expect-error
      const baseURL = new URL(baseUrl)

      debug(`experimentalJustInTimeCompile is set to ${experimentalJustInTimeCompile}. Setting the webpack-dev-server port to ${baseURL.port}.`)
      webpackDevServerPort = baseURL.port

      if (process.env.CYPRESS_INTERNAL_FORCED_CT_PORT) {
        // there currently is not a great way to test the negative cases of experimentalJustInTimeCompile compile since
        // there are only a handful of integration/unit tests with full scaffolding set up in the data-context/server packages
        // to work around this, we will use an internal env variable to force a port on the dev server to cause an error to test the error state
        const FORCED_PORT = process.env.CYPRESS_INTERNAL_FORCED_CT_PORT

        debug(`experimentalJustInTimeCompile detected with CYPRESS_INTERNAL_FORCED_CT_PORT:${process.env.CYPRESS_INTERNAL_FORCED_CT_PORT}. Forcing port for webpack-dev-server...`)
        webpackDevServerPort = FORCED_PORT
      }
    } catch (e) {
      debug(`attempted to set baseUrl port for experimentalJustInTimeCompile, but error occurred: ${e}`)
      throw e
    }
  }

  debug(`Using HtmlWebpackPlugin version ${htmlWebpackPluginVersion} from ${htmlWebpackPluginImportPath}`)

  const optimization: Record<string, any> = {
    // To prevent files from being tree shaken by webpack, we set optimization.sideEffects: false ensuring that
    // webpack does not recognize the sideEffects flag in the package.json and thus files are not unintentionally
    // dropped during testing in production mode.
    sideEffects: false,
    splitChunks: {
      chunks: 'initial',
    },
  }

  if (webpackMajorVersion === 5) {
    optimization.emitOnErrors = true
  } else {
    optimization.noEmitOnErrors = false
  }

  const publicPath = (path.sep === posixSeparator)
    ? path.join(devServerPublicPathRoute, posixSeparator)
    // The second line here replaces backslashes on windows with posix compatible slash
    // See https://github.com/cypress-io/cypress/issues/16097
    : path.join(devServerPublicPathRoute, posixSeparator)
    .replace(OsSeparatorRE, posixSeparator)

  const finalConfig = {
    mode: 'development',
    optimization,
    output: {
      filename: '[name].js',
      path: OUTPUT_PATH,
      publicPath,
    },
    plugins: [
      new (HtmlWebpackPlugin as typeof import('html-webpack-plugin-5'))({
        template: indexHtmlFile ? path.isAbsolute(indexHtmlFile) ? indexHtmlFile : path.join(projectRoot, indexHtmlFile) : undefined,
        // Angular generates all of it's scripts with <script type="module">. Live-reloading breaks without this option.
        // We need to manually set the base here to `/__cypress/src/` so that static assets load with our proxy
        ...(framework === 'angular' ? { scriptLoading: 'module', base: '/__cypress/src/' } : {}),
      }),
      new CypressCTWebpackPlugin({
        files,
        projectRoot,
        devServerEvents,
        supportFile,
        webpack,
        indexHtmlFile,
      }),
    ],
    devtool: 'inline-source-map',
  } as any

  if (isRunMode) {
    // Disable file watching when executing tests in `run` mode
    finalConfig.watchOptions = {
      ignored: '**/*',
    }
  }

  if (webpackDevServerMajorVersion === 5) {
    return {
      ...finalConfig,
      devServer: {
        port: webpackDevServerPort,
        client: {
          overlay: false,
        },
      },
    }
  }

  if (webpackDevServerMajorVersion === 4) {
    return {
      ...finalConfig,
      devServer: {
        port: webpackDevServerPort,
        client: {
          overlay: false,
        },
      },
    }
  }

  // @ts-ignore
  return {
    ...finalConfig,
    devServer: {
      port: webpackDevServerPort,
      overlay: false,
    },
  }
}
