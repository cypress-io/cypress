import path from 'path'
import proxyquire from 'proxyquire'
import { expect } from 'chai'

import { createModuleMatrixResult } from './test-helpers/createModuleMatrixResult'
import EventEmitter from 'events'

const cypressConfig = {
  projectRoot: path.join(__dirname, 'test-fixtures'),
  devServerPublicPathRoute: path.join(__dirname, './test-public-path'),
  indexHtmlFile: path.join(__dirname, 'component-index.html'),
} as Cypress.PluginConfigOptions

describe('devServer', function () {
  this.timeout(10 * 1000)

  it('fails to create devServer with webpackDevServer3', async () => {
    const { devServer } = proxyquire('../src/devServer', {
      './helpers/sourceRelativeWebpackModules': {
        sourceDefaultWebpackDependencies: () => {
          return createModuleMatrixResult({
            webpack: 4,
            webpackDevServer: 3,
          })
        } },
    }) as typeof import('../src/devServer')

    expect(devServer.create({
      specs: [],
      cypressConfig,
      webpackConfig: {},
      devServerEvents: new EventEmitter(),
    })).to.be.rejectedWith('webpack-dev-server v3 is no longer supported by @cypress/webpack-dev-server. Please update to webpack-dev-server v4 or use an older version of @cypress/webpack-dev-server.')
  })

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

    expect(result.server).to.be.instanceOf(require('webpack-dev-server'))
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

    expect(result.server).to.be.instanceOf(require('webpack-dev-server'))
    expect(result.version).to.eq(4)
  })
})
