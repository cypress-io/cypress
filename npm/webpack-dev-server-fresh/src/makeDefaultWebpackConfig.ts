import path from 'path'
import debugLib from 'debug'
import type { Configuration } from 'webpack'
import type { CreateFinalWebpackConfig } from './createWebpackDevServer'

const debug = debugLib('cypress:webpack-dev-server-fresh:makeDefaultWebpackConfig')

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
  const HtmlWebpackPlugin = _HtmlWebpackPlugin as typeof import('html-webpack-plugin-5')

  debug(`Using HtmlWebpackPlugin version ${version} from ${importPath}`)

  return {
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
        template: /* indexHtmlFile || */ path.resolve(__dirname, '..', 'index-template.html'),
      }) as any,
    ],
  }
}
