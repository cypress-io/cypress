import { expect, it, describe } from 'vitest'
import * as fs from 'fs-extra'
import cloneDeep from 'lodash/cloneDeep'
import * as path from 'path'
import {
  angularHandler,
  AngularWebpackDevServerConfig,
  BuildOptions,
  generateTsConfig,
  getAngularBuildOptions,
  getAngularCliModules,
  getAngularJson,
  getProjectConfig,
  getTempDir,
  toPosix,
} from '../../src/helpers/angularHandler'
import { scaffoldMigrationProject } from '../test-helpers/scaffoldProject'

describe('angularHandler', { timeout: 60000 }, function () {
  it('sources the config from angular-20', async () => {
    const projectRoot = await scaffoldMigrationProject('angular-20')

    process.chdir(projectRoot)
    const devServerConfig = {
      cypressConfig: {
        projectRoot,
        specPattern: 'src/**/*.cy.ts',
      } as Cypress.PluginConfigOptions,
      framework: 'angular',
    } as AngularWebpackDevServerConfig
    const { frameworkConfig: webpackConfig, sourceWebpackModulesResult } = await angularHandler(devServerConfig)

    expect(webpackConfig).toBeDefined()
    expect((webpackConfig?.entry as any).main).toBeUndefined()
    expect(sourceWebpackModulesResult.framework?.importPath).toContain(path.join('@angular-devkit', 'build-angular'))
    const projectConfig = await getProjectConfig(projectRoot)

    expect(projectConfig).toEqual({
      root: '',
      sourceRoot: 'src',
      buildOptions: {
        browser: 'src/main.ts',
        // because of the way the main fixtures are configured in the system-test projects, we need to run as a zone.js application
        polyfills: [
          'zone.js',
        ],
        tsConfig: 'tsconfig.app.json',
        assets: ['src/favicon.ico', 'src/assets'],
        styles: ['src/styles.scss'],
        optimization: false,
        extractLicenses: false,
        sourceMap: true,
      },
    })

    await expectLoadsAngularJson(projectRoot)
    await expectLoadsAngularCLiModules(projectRoot)
    await expectGeneratesTsConfig(devServerConfig, projectConfig.buildOptions, false)
    expectLoadsAngularBuildOptions(projectConfig.buildOptions)
  })

  it('sources the config from angular-21', async () => {
    const projectRoot = await scaffoldMigrationProject('angular-21')

    process.chdir(projectRoot)
    const devServerConfig = {
      cypressConfig: {
        projectRoot,
        specPattern: 'src/**/*.cy.ts',
      } as Cypress.PluginConfigOptions,
      framework: 'angular',
    } as AngularWebpackDevServerConfig
    const { frameworkConfig: webpackConfig, sourceWebpackModulesResult } = await angularHandler(devServerConfig)

    expect(webpackConfig).toBeDefined()
    expect((webpackConfig?.entry as any).main).toBeUndefined()
    expect(sourceWebpackModulesResult.framework?.importPath).toContain(path.join('@angular-devkit', 'build-angular'))
    const projectConfig = await getProjectConfig(projectRoot)

    expect(projectConfig).toEqual({
      root: '',
      sourceRoot: 'src',
      buildOptions: {
        browser: 'src/main.ts',
        tsConfig: 'tsconfig.app.json',
        assets: ['src/favicon.ico', 'src/assets'],
        styles: ['src/styles.scss'],
        optimization: false,
        extractLicenses: false,
        sourceMap: true,
      },
    })

    await expectLoadsAngularJson(projectRoot)
    await expectLoadsAngularCLiModules(projectRoot)
    await expectGeneratesTsConfig(devServerConfig, projectConfig.buildOptions, false)
    expectLoadsAngularBuildOptions(projectConfig.buildOptions)
  })

  it('allows custom project config', async () => {
    const customProjectConfig = {
      root: '',
      sourceRoot: 'src',
      buildOptions: {
        outputPath: 'dist/angular',
        index: 'src/index.html',
        main: 'src/main.ts',
        polyfills: 'src/polyfills.ts',
        tsConfig: 'tsconfig.app.json',
        inlineStyleLanguage: 'scss',
        assets: ['src/favicon.ico', 'src/assets'],
        styles: ['src/styles.scss'],
        scripts: [],
        buildOptimizer: false,
        optimization: false,
        vendorChunk: true,
        extractLicenses: false,
        sourceMap: true,
        namedChunks: true,
      },
    }
    const projectRoot = await scaffoldMigrationProject('angular-custom-config')

    process.chdir(projectRoot)
    const devServerConfig = {
      framework: 'angular',
      cypressConfig: {
        projectRoot,
        specPattern: 'src/**/*.cy.ts',
      } as Cypress.PluginConfigOptions,
      options: {
        projectConfig: customProjectConfig,
      },
    } as unknown as AngularWebpackDevServerConfig
    const { frameworkConfig: webpackConfig, sourceWebpackModulesResult } = await angularHandler(devServerConfig)

    expect(webpackConfig).toBeDefined()
    expect((webpackConfig?.entry as any).main).toBeUndefined()
    expect(sourceWebpackModulesResult.framework?.importPath).toContain(path.join('@angular-devkit', 'build-angular'))
    await expectLoadsAngularJson(projectRoot)
    await expectLoadsAngularCLiModules(projectRoot)
    await expectGeneratesTsConfig(devServerConfig, customProjectConfig.buildOptions, true)
    expectLoadsAngularBuildOptions(customProjectConfig.buildOptions)
  })
})

const expectLoadsAngularJson = async (projectRoot: string) => {
  const angularJson = await getAngularJson(projectRoot)

  expect(angularJson).not.toBeNull()
  await expect(getAngularJson(path.join('..', projectRoot))).rejects.toThrowError()
}
const expectLoadsAngularCLiModules = async (projectRoot: string) => {
  const angularCliModules = await getAngularCliModules(projectRoot)

  expect(angularCliModules.generateBrowserWebpackConfigFromContext).not.toBeNull()
  expect(angularCliModules.getStylesConfig).not.toBeNull()
  expect(angularCliModules.getCommonConfig).not.toBeNull()
  await expect(getAngularCliModules(path.join('..', projectRoot))).rejects.toThrowError()
}
const expectLoadsAngularBuildOptions = (buildOptions: BuildOptions) => {
  const tsConfig = 'tsconfig.cypress.json'
  let finalBuildOptions = getAngularBuildOptions(buildOptions, tsConfig)

  expect(finalBuildOptions.aot).toBe(false)
  expect(finalBuildOptions.optimization).toBe(false)
  expect(finalBuildOptions.tsConfig).toEqual(tsConfig)
  expect(finalBuildOptions.outputHashing).toEqual('none')
  expect(finalBuildOptions.budgets).toBeUndefined()
}
const expectGeneratesTsConfig = async (devServerConfig: AngularWebpackDevServerConfig, buildOptions: any, hasPolyfillsConfigured: boolean = false) => {
  const { projectRoot } = devServerConfig.cypressConfig
  let tsConfigPath = await generateTsConfig(devServerConfig, buildOptions)
  const tempDir = await getTempDir(path.basename(projectRoot))

  expect(tsConfigPath).toEqual(path.join(tempDir, 'tsconfig.json'))

  let tsConfig = JSON.parse(await fs.readFile(tsConfigPath, 'utf8'))

  expect(tsConfig).toEqual({
    // verifies the default `tsconfig.app.json` is extended
    extends: toPosix(path.join(projectRoot, 'tsconfig.app.json')),
    compilerOptions: {
      outDir: toPosix(path.join(projectRoot, 'out-tsc/cy')),
      allowSyntheticDefaultImports: true,
      skipLibCheck: true,
      typeRoots: [
        toPosix(path.join(projectRoot, 'node_modules')),
      ],
      types: [
        'cypress',
      ],
    },
    include: [
      toPosix(path.join(projectRoot, 'src/**/*.cy.ts')),
      ...(hasPolyfillsConfigured ? [toPosix(path.join(projectRoot, 'src/polyfills.ts'))] : []),
    ],
  })

  const modifiedBuildOptions = cloneDeep(buildOptions)

  delete modifiedBuildOptions.polyfills
  modifiedBuildOptions.tsConfig = 'tsconfig.cy.json'

  const modifiedDevServerConfig = cloneDeep(devServerConfig)
  const supportFile = path.join(projectRoot, 'cypress', 'support', 'component.ts')

  modifiedDevServerConfig.cypressConfig.supportFile = supportFile

  tsConfigPath = await generateTsConfig(modifiedDevServerConfig, modifiedBuildOptions)
  tsConfig = JSON.parse(await fs.readFile(tsConfigPath, 'utf8'))

  expect(tsConfig).toEqual({
    // verifies the custom `tsconfig.cy.json` is extended
    extends: toPosix(path.join(projectRoot, 'tsconfig.cy.json')),
    compilerOptions: {
      outDir: toPosix(path.join(projectRoot, 'out-tsc/cy')),
      allowSyntheticDefaultImports: true,
      skipLibCheck: true,
      typeRoots: [
        toPosix(path.join(projectRoot, 'node_modules')),
      ],
      types: [
        'cypress',
      ],
    },
    include: [
      toPosix(path.join(projectRoot, 'src/**/*.cy.ts')),
      toPosix(supportFile),
    ],
  })
}
