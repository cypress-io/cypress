import { expect, it, describe } from 'vitest'
import { scaffoldMigrationProject } from '../test-helpers/scaffoldProject'
import { nextHandler, allCssTests } from '../../src/helpers/nextHandler'
import type { Configuration, RuleSetRule } from 'webpack'
import * as path from 'path'
import { WebpackDevServerConfig } from '../../src/devServer'

const expectWatchOverrides = (webpackConfig: Configuration) => {
  expect((webpackConfig.watchOptions?.ignored as RegExp)?.test('**/node_modules/!(@cypress/webpack-dev-server/dist/browser.js)**')).toBe(true)
}

const expectPagesDir = (webpackConfig: Configuration, projectRoot: string) => {
  const ReactLoadablePlugin: any = webpackConfig.plugins?.find((plugin) => plugin.constructor.name === 'ReactLoadablePlugin')

  expect(ReactLoadablePlugin.pagesOrAppDir).toEqual(path.join(projectRoot, 'pages'))
}

const expectWebpackSpan = (webpackConfig: Configuration) => {
  const ProfilingPlugin: any = webpackConfig.plugins?.find((plugin) => plugin.constructor.name === 'ProfilingPlugin')

  expect(ProfilingPlugin.runWebpackSpan).toBeDefined()
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

  expect(cssRules.length).toBeGreaterThan(0)
  cssRules.forEach((rule) => expect(rule.issuer).toBeUndefined())
}

const expectCacheOverrides = (webpackConfig: Configuration, projectRoot: string) => {
  const cache: any = webpackConfig.cache

  // No cache for Webpack 4
  if (!cache || !cache.cacheDirectory) {
    return
  }

  expect(cache.cacheDirectory).eq(path.join(projectRoot, '.next', 'cache', 'cypress-webpack'))
}

// can take a while since we install node_modules
describe('nextHandler', { timeout: 60000 }, function () {
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

    expect(sourceWebpackModulesResult.webpack.importPath).toContain('next')
    expect(sourceWebpackModulesResult.webpack.majorVersion).toEqual(5)
  })

  it('throws if nodeVersion is set to bundled', async () => {
    const projectRoot = await scaffoldMigrationProject('next-14')

    process.chdir(projectRoot)

    let err

    try {
      await nextHandler({
        framework: 'next', cypressConfig: { projectRoot, nodeVersion: 'bundled' } as unknown as Cypress.PluginConfigOptions,
      } as WebpackDevServerConfig)
    } catch (e) {
      err = e
    }

    expect(err.message).toContain('Cypress cannot compile your Next.js application when "nodeVersion" is set to "bundled".')
  })
})
