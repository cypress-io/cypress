import { scaffoldMigrationProject } from '../test-helpers/scaffoldProject'
import { expect } from 'chai'
import { nextHandler } from '../../src/helpers/nextHandler'
import type { Configuration } from 'webpack'
import * as path from 'path'
import { WebpackDevServerConfig } from '../../src/devServer'
import '../support'

const expectWatchOverrides = (webpackConfig: Configuration) => {
  expect(webpackConfig.watchOptions.ignored).to.contain('**/node_modules/!(@cypress/webpack-dev-server/dist/browser.js)**')
}

const expectPagesDir = (webpackConfig: Configuration, projectRoot: string) => {
  const ReactLoadablePlugin: any = webpackConfig.plugins.find((plugin) => plugin.constructor.name === 'ReactLoadablePlugin')

  expect(ReactLoadablePlugin.pagesDir).eq(path.join(projectRoot, 'pages'))
}

const expectWebpackSpan = (webpackConfig: Configuration) => {
  const ProfilingPlugin: any = webpackConfig.plugins.find((plugin) => plugin.constructor.name === 'ProfilingPlugin')

  expect(ProfilingPlugin.runWebpackSpan).to.exist
}

describe('nextHandler', function () {
  // can take a while since we install node_modules
  this.timeout(1000 * 60)

  it('sources from a next-12 project', async () => {
    const projectRoot = await scaffoldMigrationProject('next-12')

    process.chdir(projectRoot)

    const { frameworkConfig: webpackConfig, sourceWebpackModulesResult } = await nextHandler({
      framework: 'next',
      cypressConfig: { projectRoot } as Cypress.PluginConfigOptions,
    } as WebpackDevServerConfig)

    expectWatchOverrides(webpackConfig)
    expectPagesDir(webpackConfig, projectRoot)
    expectWebpackSpan(webpackConfig)

    expect(sourceWebpackModulesResult.webpack.importPath).to.include('next')
    expect(sourceWebpackModulesResult.webpack.majorVersion).eq(5)
  })

  it('sources from a next-11 project', async () => {
    const projectRoot = await scaffoldMigrationProject('next-11')

    process.chdir(projectRoot)

    const { frameworkConfig: webpackConfig, sourceWebpackModulesResult } = await nextHandler({
      framework: 'next',
      cypressConfig: { projectRoot } as Cypress.PluginConfigOptions,
    } as WebpackDevServerConfig)

    expectWatchOverrides(webpackConfig)
    expectPagesDir(webpackConfig, projectRoot)
    expectWebpackSpan(webpackConfig)

    expect(sourceWebpackModulesResult.webpack.importPath).to.include('next')
    expect(sourceWebpackModulesResult.webpack.majorVersion).eq(5)
  })

  it('sources from a next-11-webpack-4 project', async () => {
    const projectRoot = await scaffoldMigrationProject('next-11-webpack-4')

    process.chdir(projectRoot)

    const { frameworkConfig: webpackConfig, sourceWebpackModulesResult } = await nextHandler({
      framework: 'next',
      cypressConfig: { projectRoot, cypressBinaryRoot: __dirname } as Cypress.PluginConfigOptions,
    } as WebpackDevServerConfig)

    expectWatchOverrides(webpackConfig)
    expectPagesDir(webpackConfig, projectRoot)
    expectWebpackSpan(webpackConfig)

    expect(sourceWebpackModulesResult.webpack.importPath).to.include('next')
    expect(sourceWebpackModulesResult.webpack.majorVersion).eq(4)
  })

  it('throws if nodeVersion is set to bundled', async () => {
    const projectRoot = await scaffoldMigrationProject('next-12')

    process.chdir(projectRoot)

    let err

    try {
      await nextHandler({

        framework: 'next', cypressConfig: { projectRoot, nodeVersion: 'bundled' } as Cypress.PluginConfigOptions,
      } as WebpackDevServerConfig)
    } catch (e) {
      err = e
    }

    expect(err.message).to.contain('Cypress cannot compile your Next.js application when "nodeVersion" is set to "bundled".')
  })
})
