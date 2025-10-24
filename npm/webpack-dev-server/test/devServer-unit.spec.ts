import path from 'path'
import { expect } from 'chai'
import sinon from 'sinon'

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

  it('creates a new devServer webpack5, webpackDevServer5', async () => {
    const sourceRelativeWebpackModules = require('../src/helpers/sourceRelativeWebpackModules')
    const stub = sinon.stub(sourceRelativeWebpackModules, 'sourceDefaultWebpackDependencies')
    .returns(createModuleMatrixResult({
      webpack: 5,
      webpackDevServer: 5,
    }))

    try {
      const devServerModule = require('../src/devServer')
      const { devServer } = devServerModule

      const result = await devServer.create({
        specs: [],
        cypressConfig,
        webpackConfig: {},
        devServerEvents: new EventEmitter(),
      })

      expect(result.server).to.be.instanceOf(require('webpack-dev-server'))
      expect(result.version).to.eq(5)
    } finally {
      stub.restore()
    }
  })

  // Writing to disk includes the correct source map size, where the difference will be made up from stat size vs parsed size
  // This is critical if a user is trying to debug to determine if they have large source maps or other large files in their dev-server under test
  describe('writes to disk if DEBUG=cypress-verbose:webpack-dev-server:bundle-analyzer is set', async () => {
    const WEBPACK_DEV_SERVER_VERSIONS: (5)[] = [5]

    beforeEach(() => {
      debug.enable('cypress-verbose:webpack-dev-server:bundle-analyzer')
    })

    afterEach(() => {
      debug.disable()
    })

    WEBPACK_DEV_SERVER_VERSIONS.forEach((version) => {
      it(`works for webpack-dev-server v${version}`, async () => {
        const sourceRelativeWebpackModules = require('../src/helpers/sourceRelativeWebpackModules')
        const stub = sinon.stub(sourceRelativeWebpackModules, 'sourceDefaultWebpackDependencies')
        .returns(createModuleMatrixResult({
          webpack: version,
          webpackDevServer: version,
        }))

        try {
          const devServerModule = require('../src/devServer')
          const { devServer } = devServerModule

          const result = await devServer.create({
            specs: [],
            cypressConfig,
            webpackConfig: {},
            devServerEvents: new EventEmitter(),
          })

          expect(result.server.options.devMiddleware.writeToDisk).to.be.true
        } finally {
          stub.restore()
        }
      })
    })
  })
})
