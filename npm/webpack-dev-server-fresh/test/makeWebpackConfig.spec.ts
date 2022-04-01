import { expect } from 'chai'
import EventEmitter from 'events'
import snapshot from 'snap-shot-it'
import { WebpackDevServerConfig } from '../src/devServer'
import { sourceRelativeWebpackModules } from '../src/helpers/sourceRelativeWebpackModules'
import { makeWebpackConfig } from '../src/makeWebpackConfig'

describe('makeWebpackConfig', () => {
  it('ignores userland webpack `output.publicPath`', async () => {
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
          publicPath: '/this-will-be-ignored',
        },
      },
      devServerEvents: new EventEmitter(),
    }
    const actual = await makeWebpackConfig({
      devServerConfig,
      sourceWebpackModulesResult: sourceRelativeWebpackModules(devServerConfig),
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
