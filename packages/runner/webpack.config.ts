import { waitUntilIconsBuilt } from '../../scripts/ensure-icons'
import { getCommonConfig, getSimpleConfig, getCopyWebpackPlugin } from '@packages/web-config/webpack.config.base'
import path from 'path'
import type webpack from 'webpack'

const commonConfig = getCommonConfig()
const CopyWebpackPlugin = getCopyWebpackPlugin()

const [babelLoader] = commonConfig.module.rules.flatMap(({ use }) => {
  return use && !Array.isArray(use) && use.loader.includes('babel-loader') ? [use] : []
})

const prismPlugin = [require.resolve('babel-plugin-prismjs'), {
  'languages': ['javascript', 'typescript', 'jsx', 'tsx'],
  'plugins': ['line-numbers', 'line-highlight'],
  'theme': 'default',
  'css': false,
}]

// @ts-expect-error - plugins is typed from web-config's own entries, none of which take prism's options
babelLoader.options.plugins.push(prismPlugin)

const mainConfig: webpack.Configuration = {
  ...commonConfig,
  entry: {
    cypress_runner: [path.resolve(__dirname, 'src/index.ts')],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
}

mainConfig.resolve = {
  ...mainConfig.resolve,
  alias: {
    'bluebird': require.resolve('bluebird'),
    'lodash': require.resolve('lodash'),
  },
}

const crossOriginConfig: webpack.Configuration = {
  ...commonConfig,
  entry: {
    cypress_cross_origin_runner: [path.resolve(__dirname, 'src/cross-origin.ts')],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
}

const mainInjectionConfig: webpack.Configuration = {
  ...getSimpleConfig(),
  mode: 'production',
  entry: {
    injection: [path.resolve(__dirname, 'injection/main.js')],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
}

const crossOriginInjectionConfig: webpack.Configuration = {
  ...getSimpleConfig(),
  mode: 'production',
  entry: {
    injection_cross_origin: [path.resolve(__dirname, 'injection/cross-origin.js')],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
}

const remoteAutInjectionConfig: webpack.Configuration = {
  ...getSimpleConfig(),
  mode: 'production',
  entry: {
    injection_remote_aut: [path.resolve(__dirname, 'injection/remote-aut.ts')],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
}

// The server sends this bundle to the AUT every time a page loads in Firefox and
// WebKit, and evaluating it there takes longer the more code it has, so it leaves
// out what the agent never runs and is minified in production.
const remoteAgentConfig: webpack.Configuration = {
  ...commonConfig,
  entry: {
    cypress_remote_agent: [path.resolve(__dirname, '../driver/src/remote/agent/index.ts')],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  resolve: {
    ...commonConfig.resolve,
    alias: {
      // error_utils only inspects a chai assertion's values, and the agent makes no assertions
      chai: false,
      // stack_utils maps stacks to the spec's source, which the driver does with the agent's errors
      'source-map': false,
      // ensure only compares origins in a check the driver runs, not the agent
      '@packages/network-tools': false,
    },
  },
  optimization: {
    ...commonConfig.optimization,
    minimize: process.env.NODE_ENV === 'production',
  },
}

const remoteClockConfig: webpack.Configuration = {
  ...commonConfig,
  // runs in the AUT's main world, where a Content-Security-Policy may forbid the eval the dev build wraps modules in
  plugins: commonConfig.plugins.filter((plugin) => !plugin.evalDevToolPlugin),
  entry: {
    cypress_remote_clock: [path.resolve(__dirname, '../driver/src/remote/clock/index.ts')],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
}

export default async function () {
  await waitUntilIconsBuilt()

  const cyIcons = await import('@packages/icons')

  mainConfig.plugins = [
    ...mainConfig.plugins,
    new CopyWebpackPlugin({
      patterns: [{
        from: cyIcons.getPathToFavicon('favicon.ico'),
      }],
    }),
  ]

  return [
    mainConfig,
    mainInjectionConfig,
    crossOriginConfig,
    crossOriginInjectionConfig,
    remoteAutInjectionConfig,
    remoteAgentConfig,
    remoteClockConfig,
  ]
}
