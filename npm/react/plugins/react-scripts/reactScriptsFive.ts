import _debug from 'debug'
import type { Configuration } from 'webpack'
import reactScriptsPackageJson from 'react-scripts/package.json'

const debug = _debug('@cypress/react:react-scripts')

type DefinePlugin =
  | { definitions: Record<string, Record<string, any>> }
  | undefined;
type ESLintWebpackPlugin =
  | { options: { baseConfig?: { globals?: Record<string, any> } } }
  | undefined;

export function reactScriptsFiveModifications (webpackConfig: Configuration) {
  // React-Scripts sets the webpack target to ["browserslist"] which tells
  // webpack to target the browsers found within the browserslist config
  // depending on the environment (process.env.NODE_ENV). Since we set
  // process.env.NODE_ENV = "test", webpack is unable to find any browsers and errors.
  // We set BROWSERSLIST_ENV = "development" to override the default NODE_ENV search of browsers.
  if (!process.env.BROWSERSLIST_ENV) {
    process.env.BROWSERSLIST_ENV = 'development'
  }

  // We use the "development" configuration of the react-scripts webpack config.
  // There is a conflict when settings process.env.NODE_ENV = "test" since DefinePlugin
  // uses the "development" configuration and expects process.env.NODE_ENV = "development".
  const definePlugin: DefinePlugin = webpackConfig.plugins?.find(
    (plugin) => plugin.constructor.name === 'DefinePlugin'
  ) as unknown as DefinePlugin

  if (definePlugin) {
    const processEnv = definePlugin.definitions['process.env']

    processEnv.NODE_ENV = JSON.stringify('development')

    debug('Found "DefinePlugin", modified "process.env" definition %o', processEnv)
  }

  // React-Scripts v5 no longers uses a loader to configure eslint, so we add globals
  // to the plugin.
  const eslintPlugin = webpackConfig.plugins?.find(
    (plugin) => plugin.constructor.name === 'ESLintWebpackPlugin'
  ) as unknown as ESLintWebpackPlugin

  if (eslintPlugin) {
    const cypressGlobals = ['cy', 'Cypress', 'before', 'after', 'context']
    .reduce((acc, global) => ({ ...acc, [global]: 'writable' }), {})

    eslintPlugin.options.baseConfig = {
      ...eslintPlugin.options.baseConfig,
      globals: {
        ...eslintPlugin.options.baseConfig?.globals,
        ...cypressGlobals,
      },
    }

    debug('Found ESLintWebpackPlugin, modified eslint config %o', eslintPlugin.options.baseConfig)
  }
}

export const isReactScripts5 = Number(reactScriptsPackageJson.version[0]) >= 5
