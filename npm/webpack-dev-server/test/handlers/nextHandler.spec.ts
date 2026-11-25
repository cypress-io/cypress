import { expect, it, describe } from 'vitest'
import { scaffoldMigrationProject } from '../test-helpers/scaffoldProject'
import { nextHandler, allCssTests } from '../../src/helpers/nextHandler'
import type { Configuration, RuleSetRule } from 'webpack'
import * as path from 'path'
import fs from 'fs/promises'
import type { WebpackDevServerConfig } from '../../src/devServer'

const expectWatchOverrides = (webpackConfig: Configuration) => {
  expect((webpackConfig.watchOptions?.ignored as RegExp)?.test('**/node_modules/!(@cypress/webpack-dev-server/dist/browser.js)**')).toBe(true)
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

const getSwcPagesDirs = (webpackConfig: Configuration) => {
  const pagesDirs = new Set<string | undefined>()

  JSON.stringify(webpackConfig.module, (_key, value) => {
    if (typeof value?.loader === 'string' && value.loader.includes('next-swc-loader')) {
      pagesDirs.add(value.options?.pagesDir)
    }

    return value
  })

  return [...pagesDirs]
}

// can take a while since we install node_modules
describe('nextHandler', { timeout: 60000 }, function () {
  it('sources from a next-16 project', async () => {
    const projectRoot = await scaffoldMigrationProject('next-16')

    process.chdir(projectRoot)

    const { frameworkConfig: webpackConfig, sourceWebpackModulesResult } = await nextHandler({
      framework: 'next',
      cypressConfig: { projectRoot } as Cypress.PluginConfigOptions,
    } as WebpackDevServerConfig)

    expectWatchOverrides(webpackConfig)
    expectWebpackSpan(webpackConfig)
    expectGlobalStyleOverrides(webpackConfig)
    expectCacheOverrides(webpackConfig, projectRoot)

    expect(sourceWebpackModulesResult.webpack.importPath).toContain('next')
    expect(sourceWebpackModulesResult.webpack.majorVersion).toEqual(5)
  })

  it('passes the pages directory to Next.js when the project has one', async () => {
    const projectRoot = await scaffoldMigrationProject('next-16')

    process.chdir(projectRoot)

    const { frameworkConfig: webpackConfig } = await nextHandler({
      framework: 'next',
      cypressConfig: { projectRoot } as Cypress.PluginConfigOptions,
    } as WebpackDevServerConfig)

    expect(getSwcPagesDirs(webpackConfig)).toEqual([path.join(projectRoot, 'pages')])
  })

  // Next.js treats every file under pagesDir as a page, so passing the project root
  // made dependencies that use `export *`, such as @mui/material, fail to compile.
  it('does not pass a pages directory to Next.js for an App Router-only project', async () => {
    const projectRoot = await scaffoldMigrationProject('next-16')

    await fs.rm(path.join(projectRoot, 'pages'), { recursive: true })
    process.chdir(projectRoot)

    const { frameworkConfig: webpackConfig } = await nextHandler({
      framework: 'next',
      cypressConfig: { projectRoot } as Cypress.PluginConfigOptions,
    } as WebpackDevServerConfig)

    expect(getSwcPagesDirs(webpackConfig)).toEqual([undefined])
  })

  it('throws if nodeVersion is set to bundled', async () => {
    const projectRoot = await scaffoldMigrationProject('next-16')

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
