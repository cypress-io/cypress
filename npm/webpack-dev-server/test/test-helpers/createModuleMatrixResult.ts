import path from 'path'
import type { SourceRelativeWebpackResult } from '../../src/helpers/sourceRelativeWebpackModules'

type ModulesDef = {[K in keyof ModuleMatrixResultOptions]: Record<ModuleMatrixResultOptions[K], string>}

const moduleSources: ModulesDef = {
  webpack: {
    5: 'webpack',
  },
  webpackDevServer: {
    5: 'webpack-dev-server',
  },
  htmlWebpackPlugin: {
    5: 'html-webpack-plugin-5',
  },
}

export interface ModuleMatrixResultOptions {
  webpack: 5
  webpackDevServer: 5
  htmlWebpackPlugin?: 5
}

/**
 * Helper for simulating different versions of webpack / webpack-dev-server for testing purposes
 */
export function createModuleMatrixResult (options: ModuleMatrixResultOptions): SourceRelativeWebpackResult {
  return {
    webpack: resolveModule('webpack', options.webpack),
    webpackDevServer: resolveModule('webpackDevServer', options.webpackDevServer),
    htmlWebpackPlugin: resolveModule('htmlWebpackPlugin', options.htmlWebpackPlugin ?? options.webpack),
  }
}

function resolveModule<K extends keyof ModulesDef, V extends keyof ModulesDef[K]> (name: K, version: V) {
  return {
    importPath: path.dirname(require.resolve(`${moduleSources[name][version]}/package.json`)),
    majorVersion: version,
    packageJson: require(`${moduleSources[name][version]}/package.json`),
    module: require(`${moduleSources[name][version]}`),
  }
}
