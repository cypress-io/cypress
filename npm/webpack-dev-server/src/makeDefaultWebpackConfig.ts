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
  const HtmlWebpackPlugin = _HtmlWebpackPlugin as typeof import('html-webpack-plugin-5')

  debug(`Using HtmlWebpackPlugin version ${version} from ${importPath}`)

  const finalConfig = {
    mode: 'development',
    optimization: {
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
        // Todo: Add indexHtmlFile when it gets added as a config property
        template: indexHtmlFile,
      }) as any,
    ],
  } as any

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
