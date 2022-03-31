import path from 'path'
import proxyquire from 'proxyquire'
import { expect } from 'chai'

import { createModuleMatrixResult } from './test-helpers/createModuleMatrixResult'

const cypressConfig = {
  projectRoot: path.join(__dirname, 'test-fixtures'),
} as Cypress.PluginConfigOptions

describe('devServer', () => {
  it('creates a new devServer webpack4, webpackDevServer3', () => {
    const { devServer } = proxyquire('../src/devServer', {
      './helpers/sourceRelativeWebpackModules': {
        sourceRelativeWebpackModules: () => {
          return createModuleMatrixResult({
            webpack: 4,
            webpackDevServer: 3,
          })
        } },
    }) as typeof import('../src/devServer')

    const result = devServer.create({
      cypressConfig,
    })

    expect(result.server).to.be.instanceOf(require('webpack-dev-server-3'))
    expect(result.version).to.eq(3)
  })

  it('creates a new devServer webpack4, webpackDevServer4', () => {
    const { devServer } = proxyquire('../src/devServer', {
      './helpers/sourceRelativeWebpackModules': {
        sourceRelativeWebpackModules: () => {
          return createModuleMatrixResult({
            webpack: 4,
            webpackDevServer: 4,
          })
        } },
    }) as typeof import('../src/devServer')

    const result = devServer.create({
      cypressConfig,
    })

    expect(result.server).to.be.instanceOf(require('webpack-dev-server'))
    expect(result.version).to.eq(4)
  })

  it('creates a new devServer webpack5, webpackDevServer4', () => {
    const { devServer } = proxyquire('../src/devServer', {
      './helpers/sourceRelativeWebpackModules': {
        sourceRelativeWebpackModules: () => {
          return createModuleMatrixResult({
            webpack: 5,
            webpackDevServer: 4,
          })
        } },
    }) as typeof import('../src/devServer')

    const result = devServer.create({
      cypressConfig,
    })

    expect(result.server).to.be.instanceOf(require('webpack-dev-server'))
    expect(result.version).to.eq(4)
  })
})
