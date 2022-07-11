import path from 'path'
import type { Configuration } from 'webpack'
import type { CreateFinalWebpackConfig } from './createWebpackDevServer'
import { CypressIndexHtmlWebpackPlugin } from './IndexHtmlWebpackPlugin'

export const OUTPUT_PATH = path.join(__dirname, 'dist')

/**
 * @returns {import('webpack').Configuration}
 * @internal
 */
export function makeDefaultWebpackConfig (
  config: CreateFinalWebpackConfig,
  publicPath: string,
): Configuration {
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
      new CypressIndexHtmlWebpackPlugin(config, publicPath),
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
