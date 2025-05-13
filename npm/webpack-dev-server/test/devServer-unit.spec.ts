import path from 'path'
import proxyquire from 'proxyquire'
import { expect } from 'chai'

import { createModuleMatrixResult } from './test-helpers/createModuleMatrixResult'
import EventEmitter from 'events'
import debug from 'debug'

const cypressConfig = {
  projectRoot: path.join(__dirname, 'test-fixtures'),
  devServerPublicPathRoute: path.join(__dirname, './test-public-path'),
  indexHtmlFile: path.join(__dirname, 'component-index.html'),
} as Cypress.PluginConfigOptions

describe('devServer', function () {
  this.timeout(10 * 1000)

  it('creates a new devServer webpack4, webpackDevServer4', async () => {
    const { devServer } = proxyquire('../src/devServer', {
      './helpers/sourceRelativeWebpackModules': {
        sourceDefaultWebpackDependencies: () => {
          return createModuleMatrixResult({
            webpack: 4,
            webpackDevServer: 4,
          })
        } },
    }) as typeof import('../src/devServer')

    const result = await devServer.create({
      specs: [],
      cypressConfig,
      webpackConfig: {},
      devServerEvents: new EventEmitter(),
    })

    expect(result.server).to.be.instanceOf(require('webpack-dev-server-4'))
    expect(result.version).to.eq(4)
  })

  it('creates a new devServer webpack5, webpackDevServer4', async () => {
    const { devServer } = proxyquire('../src/devServer', {
      './helpers/sourceRelativeWebpackModules': {
        sourceDefaultWebpackDependencies: () => {
          return createModuleMatrixResult({
            webpack: 5,
            webpackDevServer: 4,
          })
        } },
    }) as typeof import('../src/devServer')

    const result = await devServer.create({
      specs: [],
      cypressConfig,
      webpackConfig: {},
      devServerEvents: new EventEmitter(),
    })

    expect(result.server).to.be.instanceOf(require('webpack-dev-server-4'))
    expect(result.version).to.eq(4)
  })

  it('creates a new devServer webpack5, webpackDevServer5', async () => {
    const { devServer } = proxyquire('../src/devServer', {
      './helpers/sourceRelativeWebpackModules': {
        sourceDefaultWebpackDependencies: () => {
          return createModuleMatrixResult({
            webpack: 5,
            webpackDevServer: 5,
          })
        } },
    }) as typeof import('../src/devServer')

    const result = await devServer.create({
      specs: [],
      cypressConfig,
      webpackConfig: {},
      devServerEvents: new EventEmitter(),
    })

    expect(result.server).to.be.instanceOf(require('webpack-dev-server'))
    expect(result.version).to.eq(5)
  })

  // Writing to disk includes the correct source map size, where the difference will be made up from stat size vs parsed size
  // This is critical if a user is trying to debug to determine if they have large source maps or other large files in their dev-server under test
  describe('writes to disk if DEBUG=cypress-verbose:webpack-dev-server:bundle-analyzer is set', async () => {
    const WEBPACK_DEV_SERVER_VERSIONS: (4 | 5)[] = [4, 5]

    beforeEach(() => {
      debug.enable('cypress-verbose:webpack-dev-server:bundle-analyzer')
    })

    afterEach(() => {
      debug.disable()
    })

    WEBPACK_DEV_SERVER_VERSIONS.forEach((version) => {
      it(`works for webpack-dev-server v${version}`, async () => {
        const { devServer } = proxyquire('../src/devServer', {
          './helpers/sourceRelativeWebpackModules': {
            sourceDefaultWebpackDependencies: () => {
              // using webpack version to wds version as it really doesn't matter much when testing here.
              // webpack config is tested separately in makeWebpackConfig tests
              return createModuleMatrixResult({
                webpack: version,
                webpackDevServer: version,
              })
            } },
        }) as typeof import('../src/devServer')

        const result = await devServer.create({
          specs: [],
          cypressConfig,
          webpackConfig: {},
          devServerEvents: new EventEmitter(),
        })

        // @ts-expect-error
        expect(result.server.options.devMiddleware.writeToDisk).to.be.true
      })
    })
  })
})
