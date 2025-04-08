import { scaffoldMigrationProject } from '../test-helpers/scaffoldProject'
import { expect } from 'chai'
import { nextHandler, allCssTests } from '../../src/helpers/nextHandler'
import type { Configuration, RuleSetRule } from 'webpack'
import * as path from 'path'
import { WebpackDevServerConfig } from '../../src/devServer'
import '../support'

const expectWatchOverrides = (webpackConfig: Configuration) => {
  expect((webpackConfig.watchOptions?.ignored as RegExp)?.test('**/node_modules/!(@cypress/webpack-dev-server/dist/browser.js)**')).to.be.true
}

const expectPagesDir = (webpackConfig: Configuration, projectRoot: string) => {
  const ReactLoadablePlugin: any = webpackConfig.plugins?.find((plugin) => plugin.constructor.name === 'ReactLoadablePlugin')

  expect(ReactLoadablePlugin.pagesOrAppDir).eq(path.join(projectRoot, 'pages'))
}

const expectWebpackSpan = (webpackConfig: Configuration) => {
  const ProfilingPlugin: any = webpackConfig.plugins?.find((plugin) => plugin.constructor.name === 'ProfilingPlugin')

  expect(ProfilingPlugin.runWebpackSpan).to.exist
}

const expectGlobalStyleOverrides = (webpackConfig: Configuration) => {
  const cssRules: RuleSetRule[] = []

  for (const rule of webpackConfig.module?.rules as RuleSetRule[]) {
    if (rule.oneOf) {
      for (const oneOf of rule.oneOf) {
        if (oneOf.test && allCssTests.some((re) => re.source === (oneOf as any).test?.source)) {
          cssRules.push(oneOf)
        }
      }
    }
  }

  expect(cssRules).to.have.length.greaterThan(0)
  cssRules.forEach((rule) => expect(rule.issuer).to.be.undefined)
}

const expectCacheOverrides = (webpackConfig: Configuration, projectRoot: string) => {
  const cache: any = webpackConfig.cache

  // No cache for Webpack 4
  if (!cache || !cache.cacheDirectory) {
    return
  }

  expect(cache.cacheDirectory).eq(path.join(projectRoot, '.next', 'cache', 'cypress-webpack'))
}

describe('nextHandler', function () {
  // can take a while since we install node_modules
  this.timeout(1000 * 60)

  it('sources from a next-14 project', async () => {
    const projectRoot = await scaffoldMigrationProject('next-14')

    process.chdir(projectRoot)

    const { frameworkConfig: webpackConfig, sourceWebpackModulesResult } = await nextHandler({
      framework: 'next',
      cypressConfig: { projectRoot } as Cypress.PluginConfigOptions,
    } as WebpackDevServerConfig)

    expectWatchOverrides(webpackConfig)
    expectPagesDir(webpackConfig, projectRoot)
    expectWebpackSpan(webpackConfig)
    expectGlobalStyleOverrides(webpackConfig)
    expectCacheOverrides(webpackConfig, projectRoot)

    expect(sourceWebpackModulesResult.webpack.importPath).to.include('next')
    expect(sourceWebpackModulesResult.webpack.majorVersion).eq(5)
  })

  it('throws if nodeVersion is set to bundled', async () => {
    const projectRoot = await scaffoldMigrationProject('next-14')

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
