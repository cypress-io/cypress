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
})
