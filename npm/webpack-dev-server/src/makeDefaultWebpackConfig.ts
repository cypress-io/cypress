import path from 'path'
import debugLib from 'debug'
import type { Configuration } from 'webpack'
import type { CreateFinalWebpackConfig } from './createWebpackDevServer'

const debug = debugLib('cypress:webpack-dev-server:makeDefaultWebpackConfig')

const OUTPUT_PATH = path.join(__dirname, 'dist')

/**
 * @returns {import('webpack').Configuration}
 * @internal
 */
export function makeDefaultWebpackConfig (
  config: CreateFinalWebpackConfig,
): Configuration {
  const {
    module: _HtmlWebpackPlugin,
    packageJson: { version },
    importPath,
  } = config.sourceWebpackModulesResult.htmlWebpackPlugin
  const indexHtmlFile = config.devServerConfig.cypressConfig.indexHtmlFile
  const isRunMode = config.devServerConfig.cypressConfig.isTextTerminal
  const HtmlWebpackPlugin = _HtmlWebpackPlugin as typeof import('html-webpack-plugin-5')

  debug(`Using HtmlWebpackPlugin version ${version} from ${importPath}`)

  const optimization = <Record<string, any>>{}

  if (config.sourceWebpackModulesResult.webpack.majorVersion === 5) {
    optimization.emitOnErrors = true
  } else {
    optimization.noEmitOnErrors = false
  }

  // To prevent files from being tree shaken by webpack, we set optimization.sideEffects: false ensuring that
  // webpack does not recognize the sideEffects flag in the package.json and thus files are not unintentionally
  // dropped during testing in production mode.
  optimization.sideEffects = false

  const finalConfig = {
    mode: 'development',
    optimization: {
      ...optimization,
      splitChunks: {
        chunks: 'all',
      },
    },
    output: {
      filename: '[name].js',
      path: OUTPUT_PATH,
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: indexHtmlFile,
        // Angular generates all of it's scripts with <script type="module">. Live-reloading breaks without this option.
        // We need to manually set the base here to `/__cypress/src/` so that static assets load with our proxy
        ...(config.devServerConfig.framework === 'angular' ? { scriptLoading: 'module', base: '/__cypress/src/' } : {}),
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

  if (config.sourceWebpackModulesResult.webpackDevServer.majorVersion === 4) {
    return {
      ...finalConfig,
      devServer: {
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
      overlay: false,
    },
  }
}
