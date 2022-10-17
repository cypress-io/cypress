import Chai, { expect } from 'chai'
import EventEmitter from 'events'
import snapshot from 'snap-shot-it'
import { IgnorePlugin } from 'webpack'
import { WebpackDevServerConfig } from '../src/devServer'
import { CYPRESS_WEBPACK_ENTRYPOINT, makeWebpackConfig } from '../src/makeWebpackConfig'
import { createModuleMatrixResult } from './test-helpers/createModuleMatrixResult'
import sinon from 'sinon'
import SinonChai from 'sinon-chai'
import type { SourceRelativeWebpackResult } from '../src/helpers/sourceRelativeWebpackModules'

Chai.use(SinonChai)

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
        optimization: {
          noEmitOnErrors: true, // This will be overridden by makeWebpackConfig.ts
        },
        devtool: 'eval', // This will be overridden by makeWebpackConfig.ts
      },
      devServerEvents: new EventEmitter(),
    }
    const actual = await makeWebpackConfig({
      devServerConfig,
      sourceWebpackModulesResult: createModuleMatrixResult({
        webpack: 4,
        webpackDevServer: 3,
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
        optimization: {
          emitOnErrors: false, // This will be overridden by makeWebpackConfig.ts
        },
        devtool: 'eval', // This will be overridden by makeWebpackConfig.ts
      },
      devServerEvents: new EventEmitter(),
    }
    const actual = await makeWebpackConfig({
      devServerConfig,
      sourceWebpackModulesResult: createModuleMatrixResult({
        webpack: 5,
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

  it('removes entrypoint from merged webpackConfig', async () => {
    const devServerConfig: WebpackDevServerConfig = {
      specs: [],
      cypressConfig: {
        projectRoot: '.',
        devServerPublicPathRoute: '/test-public-path',
      } as Cypress.PluginConfigOptions,
      webpackConfig: {
        entry: { main: 'src/index.js' },
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

    expect(actual.entry).eq(CYPRESS_WEBPACK_ENTRYPOINT)
  })

  it('preserves entrypoint from merged webpackConfig if framework = angular', async () => {
    const devServerConfig: WebpackDevServerConfig = {
      specs: [],
      cypressConfig: {
        projectRoot: '.',
        devServerPublicPathRoute: '/test-public-path',
      } as Cypress.PluginConfigOptions,
      webpackConfig: {
        entry: { main: 'src/index.js' },
      },
      devServerEvents: new EventEmitter(),
      framework: 'angular',
    }
    const actual = await makeWebpackConfig({
      devServerConfig,
      sourceWebpackModulesResult: createModuleMatrixResult({
        webpack: 4,
        webpackDevServer: 4,
      }),
    })

    expect(actual.entry).deep.eq({
      main: 'src/index.js',
      'cypress-entry': CYPRESS_WEBPACK_ENTRYPOINT,
    })
  })

  it('calls webpackConfig if it is a function, passing in the base config', async () => {
    const testPlugin = new IgnorePlugin({
      contextRegExp: /aaa/,
      resourceRegExp: /bbb/,
    })

    const modifyConfig = sinon.spy(async () => {
      return {
        plugins: [testPlugin],
      }
    })

    const devServerConfig: WebpackDevServerConfig = {
      specs: [],
      cypressConfig: {
        isTextTerminal: false,
        projectRoot: '.',
        supportFile: '/support.js',
        devServerPublicPathRoute: '/test-public-path', // This will be overridden by makeWebpackConfig.ts
      } as Cypress.PluginConfigOptions,
      webpackConfig: modifyConfig,
      devServerEvents: new EventEmitter(),
    }

    const actual = await makeWebpackConfig({
      devServerConfig,
      sourceWebpackModulesResult: createModuleMatrixResult({
        webpack: 4,
        webpackDevServer: 4,
      }),
    })

    expect(actual.plugins.length).to.eq(3)
    expect(modifyConfig).to.have.been.called
    // merged plugins get added at the top of the chain by default
    // should be merged, not overriding existing plugins
    expect(actual.plugins[0].constructor.name).to.eq('IgnorePlugin')
    expect(actual.plugins[1].constructor.name).to.eq('HtmlWebpackPlugin')
    expect(actual.plugins[2].constructor.name).to.eq('CypressCTWebpackPlugin')
  })

  describe('file watching', () => {
    let sourceWebpackModulesResult: SourceRelativeWebpackResult
    let devServerConfig: WebpackDevServerConfig

    beforeEach(() => {
      devServerConfig = {
        specs: [],
        cypressConfig: {
          projectRoot: '.',
          devServerPublicPathRoute: '/test-public-path',
        } as Cypress.PluginConfigOptions,
        webpackConfig: {
          entry: { main: 'src/index.js' },
        },
        devServerEvents: new EventEmitter(),
      }
    })

    describe('webpack-dev-server v3', () => {
      beforeEach(() => {
        sourceWebpackModulesResult = createModuleMatrixResult({
          webpack: 4,
          webpackDevServer: 4,
        })
      })

      it('is disabled in run mode', async () => {
        devServerConfig.cypressConfig.isTextTerminal = true

        const actual = await makeWebpackConfig({
          devServerConfig,
          sourceWebpackModulesResult,
        })

        expect(actual.watchOptions.ignored).to.eql('**/*')
      })

      it('uses defaults in open mode', async () => {
        devServerConfig.cypressConfig.isTextTerminal = false

        const actual = await makeWebpackConfig({
          devServerConfig,
          sourceWebpackModulesResult,
        })

        expect(actual.watchOptions?.ignored).to.be.undefined
      })
    })

    describe('webpack-dev-server v4', () => {
      beforeEach(() => {
        sourceWebpackModulesResult = createModuleMatrixResult({
          webpack: 5,
          webpackDevServer: 4,
        })
      })

      it('is disabled in run mode', async () => {
        devServerConfig.cypressConfig.isTextTerminal = true

        const actual = await makeWebpackConfig({
          devServerConfig,
          sourceWebpackModulesResult,
        })

        expect(actual.watchOptions.ignored).to.eql('**/*')
      })

      it('uses defaults in open mode', async () => {
        devServerConfig.cypressConfig.isTextTerminal = false

        const actual = await makeWebpackConfig({
          devServerConfig,
          sourceWebpackModulesResult,
        })

        expect(actual.watchOptions?.ignored).to.be.undefined
      })
    })
  })
})
