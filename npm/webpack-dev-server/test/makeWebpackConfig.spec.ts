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
import path from 'path'

Chai.use(SinonChai)

const WEBPACK_DEV_SERVER_VERSIONS: (4 | 5)[] = [4, 5]

describe('makeWebpackConfig', () => {
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
    ;(actual as any).plugins = actual.plugins.map((p) => p.constructor.name)

    // these will include paths from the user's local file system, so we should not include them the snapshot
    delete actual.output.path
    delete actual.entry

    expect(actual.output.publicPath).to.eq('/test-public-path/')
    snapshot(actual)
  })

  it('ignores userland webpack `output.publicPath` and `devServer.overlay` with webpack-dev-server v5', async () => {
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
        webpackDevServer: 5,
      }),
    })

    // plugins contain circular deps which cannot be serialized in a snapshot.
    // instead just compare the name and order of the plugins.
    ;(actual as any).plugins = actual.plugins.map((p) => p.constructor.name)

    // these will include paths from the user's local file system, so we should not include them the snapshot
    delete actual.output.path
    delete actual.entry

    expect(actual.output.publicPath).to.eq('/test-public-path/')
    snapshot(actual)
  })

  WEBPACK_DEV_SERVER_VERSIONS.forEach((VERSION) => {
    describe(`webpack-dev-server: v${VERSION}`, () => {
      it(`removes entrypoint from merged webpackConfig`, async () => {
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
            webpack: VERSION,
            webpackDevServer: VERSION,
          }),
        })

        expect(actual.entry).eq(CYPRESS_WEBPACK_ENTRYPOINT)
      })

      it(`removes entrypoint from merged webpackConfig`, async () => {
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
            webpack: VERSION,
            webpackDevServer: VERSION,
          }),
        })

        expect(actual.entry).eq(CYPRESS_WEBPACK_ENTRYPOINT)
      })

      it(`preserves entrypoint from merged webpackConfig if framework = angular`, async () => {
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
            webpack: VERSION,
            webpackDevServer: VERSION,
          }),
        })

        expect(actual.entry).deep.eq({
          main: 'src/index.js',
          'cypress-entry': CYPRESS_WEBPACK_ENTRYPOINT,
        })
      })

      context('config resolution', () => {
        it('with <project-root>/webpack.config.js', async () => {
          const devServerConfig: WebpackDevServerConfig = {
            specs: [],
            cypressConfig: {
              projectRoot: path.join(__dirname, 'fixtures'),
              devServerPublicPathRoute: '/test-public-path', // This will be overridden by makeWebpackConfig.ts
            } as Cypress.PluginConfigOptions,
            devServerEvents: new EventEmitter(),
          }

          const actual = await makeWebpackConfig({
            devServerConfig,
            sourceWebpackModulesResult: createModuleMatrixResult({
              webpack: 5,
              webpackDevServer: VERSION,
            }),
          })

          expect(actual.plugins.map((p) => p.constructor.name)).to.have.members(
            ['CypressCTWebpackPlugin', 'HtmlWebpackPlugin', 'FromWebpackConfigFile'],
          )
        })

        it('with component.devServer.webpackConfig', async () => {
          class FromInlineWebpackConfig {
            apply () {}
          }

          const devServerConfig: WebpackDevServerConfig = {
            specs: [],
            cypressConfig: {
              projectRoot: path.join(__dirname, 'fixtures'),
              devServerPublicPathRoute: '/test-public-path', // This will be overridden by makeWebpackConfig.ts
            } as Cypress.PluginConfigOptions,
            devServerEvents: new EventEmitter(),
            webpackConfig: {
              plugins: [new FromInlineWebpackConfig()],
            },
          }

          const actual = await makeWebpackConfig({
            devServerConfig,
            sourceWebpackModulesResult: createModuleMatrixResult({
              webpack: 5,
              webpackDevServer: VERSION,
            }),
          })

          expect(actual.plugins.map((p) => p.constructor.name)).to.have.members(
            ['CypressCTWebpackPlugin', 'HtmlWebpackPlugin', 'FromInlineWebpackConfig'],
          )
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
              webpack: VERSION,
              webpackDevServer: VERSION,
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
      })
    })
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

    describe('webpack-dev-server v5', () => {
      beforeEach(() => {
        sourceWebpackModulesResult = createModuleMatrixResult({
          webpack: 5,
          webpackDevServer: 5,
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

  describe('justInTimeCompile', () => {
    let devServerConfig: WebpackDevServerConfig

    const WEBPACK_MATRIX: {
      webpack: 4 | 5
      wds: 4 | 5
    }[] = [
      {
        webpack: 4,
        wds: 4,
      },
      {
        webpack: 5,
        wds: 4,
      },
      {
        webpack: 5,
        wds: 5,
      },
    ]

    beforeEach(() => {
      devServerConfig = {
        specs: [],
        cypressConfig: {
          projectRoot: '.',
          devServerPublicPathRoute: '/test-public-path',
          justInTimeCompile: true,
          baseUrl: null,
        } as Cypress.PluginConfigOptions,
        webpackConfig: {
          entry: { main: 'src/index.js' },
        },
        devServerEvents: new EventEmitter(),
      }
    })

    WEBPACK_MATRIX.forEach(({ webpack, wds }) => {
      describe(`webpack: v${webpack} with webpack-dev-server v${wds}`, () => {
        describe('run mode', () => {
          beforeEach(() => {
            devServerConfig.cypressConfig.isTextTerminal = true
          })

          it('enables watching', async () => {
            const actual = await makeWebpackConfig({
              devServerConfig,
              sourceWebpackModulesResult: createModuleMatrixResult({
                webpack,
                webpackDevServer: wds,
              }),
            })

            expect(actual.watchOptions?.ignored).to.deep.equal(/node_modules/)
          })
        })
      })
    })
  })
})
