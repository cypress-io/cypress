import { expect, it, describe } from 'vitest'
import { scaffoldMigrationProject } from '../test-helpers/scaffoldProject'
import { nextHandler, allCssTests } from '../../src/helpers/nextHandler'
import type { Configuration, RuleSetRule } from 'webpack'
import * as path from 'path'
import fs from 'fs/promises'
import type { WebpackDevServerConfig } from '../../src/devServer'
import type { ProjectFixtureDir } from '@tooling/system-tests'

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

// Collects the `pagesDir` that Next's SWC or Babel loader uses to decide which files are pages
const getLoaderPagesDirs = (webpackConfig: Configuration) => {
  const pagesDirs = new Set<string | undefined>()

  JSON.stringify(webpackConfig.module, (_key, value) => {
    if (typeof value?.loader === 'string' && /next-swc-loader|babel[\\/]loader/.test(value.loader)) {
      pagesDirs.add(value.options?.pagesDir)
    }

    return value
  })

  return [...pagesDirs]
}

const loadNextProject = async (project: ProjectFixtureDir, prepare?: (projectRoot: string) => Promise<void>) => {
  const projectRoot = await scaffoldMigrationProject(project)

  await prepare?.(projectRoot)
  process.chdir(projectRoot)

  const { frameworkConfig: webpackConfig } = await nextHandler({
    framework: 'next',
    cypressConfig: { projectRoot } as Cypress.PluginConfigOptions,
  } as WebpackDevServerConfig)

  return { projectRoot, webpackConfig }
}

const moveToSrcPages = async (projectRoot: string) => {
  await fs.mkdir(path.join(projectRoot, 'src'))
  await fs.rename(path.join(projectRoot, 'pages'), path.join(projectRoot, 'src', 'pages'))
}

const addBabelConfig = async (projectRoot: string) => {
  await fs.writeFile(path.join(projectRoot, '.babelrc'), JSON.stringify({ presets: ['next/babel'] }))
}

// App Router-only projects: an `app` directory and no `pages` directory
const APP_ROUTER_PROJECTS: ProjectFixtureDir[] = ['next-15-tsconfig-tailwind', 'next-16-tsconfig-tailwind']

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
    const { projectRoot, webpackConfig } = await loadNextProject('next-16')

    expect(getLoaderPagesDirs(webpackConfig)).toEqual([path.join(projectRoot, 'pages')])
  })

  it('passes src/pages to Next.js when the project uses it', async () => {
    const { projectRoot, webpackConfig } = await loadNextProject('next-16', moveToSrcPages)

    expect(getLoaderPagesDirs(webpackConfig)).toEqual([path.join(projectRoot, 'src', 'pages')])
  })

  for (const project of APP_ROUTER_PROJECTS) {
    // Next treats every file whose path starts with pagesDir as a page and rejects
    // `export *` in pages, so pagesDir must not match any project or node_modules file.
    it(`passes a pages directory that matches no files to Next.js for ${project}`, async () => {
      const { projectRoot, webpackConfig } = await loadNextProject(project)
      const [pagesDir] = getLoaderPagesDirs(webpackConfig)

      expect(pagesDir).toEqual(`${path.join(projectRoot, 'pages')}${path.sep}`)
      await expect(fs.access(pagesDir!)).rejects.toThrow('ENOENT')

      for (const file of ['app/page.tsx', 'pages-legacy/index.ts', 'pages.ts', 'node_modules/@mui/material/Chip/index.mjs']) {
        expect(path.join(projectRoot, file).startsWith(pagesDir!), file).toBe(false)
      }
    })

    it(`loads ${project} with a Babel config`, async () => {
      const { projectRoot, webpackConfig } = await loadNextProject(project, addBabelConfig)

      expect(getLoaderPagesDirs(webpackConfig)).toEqual([`${path.join(projectRoot, 'pages')}${path.sep}`])
    })
  }

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
