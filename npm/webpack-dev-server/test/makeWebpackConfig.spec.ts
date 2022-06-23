import { expect } from 'chai'
import EventEmitter from 'events'
import snapshot from 'snap-shot-it'
import { WebpackDevServerConfig } from '../src/devServer'
import { sourceDefaultWebpackDependencies } from '../src/helpers/sourceRelativeWebpackModules'
import { makeWebpackConfig } from '../src/makeWebpackConfig'
import { createModuleMatrixResult } from './test-helpers/createModuleMatrixResult'

describe('makeWebpackConfig', () => {
  it('ignores userland webpack `output.publicPath` and `devServer.overlay` with webpack-dev-server v3', async () => {
    const devServerConfig: WebpackDevServerConfig = {
      specs: [],
      cypressConfig: {
        isTextTerminal: false,
        projectRoot: '.',
        supportFile: '/support.js',
        devServerPublicPathRoute: '/test-public-path',
      } as Cypress.PluginConfigOptions,
      webpackConfig: {
        output: {
          publicPath: '/this-will-be-ignored', // This will be overridden by makeWebpackConfig.ts
        },
        devServer: {
          progress: true,
          overlay: true, // This will be overridden by makeWebpackConfig.ts
        },
      },
      devServerEvents: new EventEmitter(),
    }
    const actual = await makeWebpackConfig({
      devServerConfig,
      sourceWebpackModulesResult: sourceDefaultWebpackDependencies(devServerConfig),
    })

    // plugins contain circular deps which cannot be serialized in a snapshot.
    // instead just compare the name and order of the plugins.
    actual.plugins = actual.plugins.map((p) => p.constructor.name)

    // these will include paths from the user's local file system, so we should not include them the snapshot
    delete actual.output.path
    delete actual.entry

    expect(actual.output.publicPath).to.eq('/test-public-path/')
    snapshot(actual)
  })

  it('ignores userland webpack `output.publicPath` and `devServer.overlay` with webpack-dev-server v4', async () => {
    const devServerConfig: WebpackDevServerConfig = {
      specs: [],
      cypressConfig: {
        isTextTerminal: false,
        projectRoot: '.',
        supportFile: '/support.js',
        devServerPublicPathRoute: '/test-public-path', // This will be overridden by makeWebpackConfig.ts
      } as Cypress.PluginConfigOptions,
      webpackConfig: {
        output: {
          publicPath: '/this-will-be-ignored',
        },
        devServer: {
          magicHtml: true,
          client: {
            progress: false,
            overlay: true, // This will be overridden by makeWebpackConfig.ts
          },
        },
      },
      devServerEvents: new EventEmitter(),
    }
    const actual = await makeWebpackConfig({
      devServerConfig,
      sourceWebpackModulesResult: createModuleMatrixResult({
        webpack: 4,
        webpackDevServer: 4,
      }),
    })

    // plugins contain circular deps which cannot be serialized in a snapshot.
    // instead just compare the name and order of the plugins.
    actual.plugins = actual.plugins.map((p) => p.constructor.name)

    // these will include paths from the user's local file system, so we should not include them the snapshot
    delete actual.output.path
    delete actual.entry

    expect(actual.output.publicPath).to.eq('/test-public-path/')
    snapshot(actual)
  })
})
