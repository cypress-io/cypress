import chai, { expect } from 'chai'
import chaiPromise from 'chai-as-promised'
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
import '../support'
import { scaffoldMigrationProject } from '../test-helpers/scaffoldProject'

chai.use(chaiPromise)
describe('angularHandler', function () {
  this.timeout(1000 * 60)

  it('sources the config from angular-17', async () => {
    const projectRoot = await scaffoldMigrationProject('angular-17')

    process.chdir(projectRoot)
    const devServerConfig = {
      cypressConfig: {
        projectRoot,
        specPattern: 'src/**/*.cy.ts',
      } as Cypress.PluginConfigOptions,
      framework: 'angular',
    } as AngularWebpackDevServerConfig
    const { frameworkConfig: webpackConfig, sourceWebpackModulesResult } = await angularHandler(devServerConfig)

    expect(webpackConfig).to.exist
    expect((webpackConfig?.entry as any).main).to.be.undefined
    expect(sourceWebpackModulesResult.framework?.importPath).to.include(path.join('@angular-devkit', 'build-angular'))
    const { buildOptions } = await expectNormalizeProjectConfig(projectRoot)

    await expectLoadsAngularJson(projectRoot)
    await expectLoadsAngularCLiModules(projectRoot)
    await expectGeneratesTsConfig(devServerConfig, buildOptions)
    expectLoadsAngularBuildOptions(buildOptions)
  })

  it('sources the config from angular-19', async () => {
    const projectRoot = await scaffoldMigrationProject('angular-19')

    process.chdir(projectRoot)
    const devServerConfig = {
      cypressConfig: {
        projectRoot,
        specPattern: 'src/**/*.cy.ts',
      } as Cypress.PluginConfigOptions,
      framework: 'angular',
    } as AngularWebpackDevServerConfig
    const { frameworkConfig: webpackConfig, sourceWebpackModulesResult } = await angularHandler(devServerConfig)

    expect(webpackConfig).to.exist
    expect((webpackConfig?.entry as any).main).to.be.undefined
    expect(sourceWebpackModulesResult.framework?.importPath).to.include(path.join('@angular-devkit', 'build-angular'))
    const { buildOptions } = await expectNormalizeProjectConfig(projectRoot)

    await expectLoadsAngularJson(projectRoot)
    await expectLoadsAngularCLiModules(projectRoot)
    await expectGeneratesTsConfig(devServerConfig, buildOptions)
    expectLoadsAngularBuildOptions(buildOptions)
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

    expect(webpackConfig).to.exist
    expect((webpackConfig?.entry as any).main).to.be.undefined
    expect(sourceWebpackModulesResult.framework?.importPath).to.include(path.join('@angular-devkit', 'build-angular'))
    await expectLoadsAngularJson(projectRoot)
    await expectLoadsAngularCLiModules(projectRoot)
    await expectGeneratesTsConfig(devServerConfig, customProjectConfig.buildOptions)
    expectLoadsAngularBuildOptions(customProjectConfig.buildOptions)
  })
})

const expectNormalizeProjectConfig = async (projectRoot: string) => {
  const projectConfig = await getProjectConfig(projectRoot)

  expect(projectConfig).to.deep.eq({
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
  })

  return projectConfig
}
const expectLoadsAngularJson = async (projectRoot: string) => {
  const angularJson = await getAngularJson(projectRoot)

  expect(angularJson).to.not.be.null
  await expect(getAngularJson(path.join('..', projectRoot))).to.be.rejected
}
const expectLoadsAngularCLiModules = async (projectRoot: string) => {
  const angularCliModules = await getAngularCliModules(projectRoot)

  expect(angularCliModules.generateBrowserWebpackConfigFromContext).to.not.be.null
  expect(angularCliModules.getStylesConfig).to.not.be.null
  expect(angularCliModules.getCommonConfig).to.not.be.null
  await expect(getAngularCliModules(path.join('..', projectRoot))).to.be.rejected
}
const expectLoadsAngularBuildOptions = (buildOptions: BuildOptions) => {
  const tsConfig = 'tsconfig.cypress.json'
  let finalBuildOptions = getAngularBuildOptions(buildOptions, tsConfig)

  expect(finalBuildOptions.aot).to.be.false
  expect(finalBuildOptions.optimization).to.be.false
  expect(finalBuildOptions.tsConfig).to.equal(tsConfig)
  expect(finalBuildOptions.outputHashing).to.equal('none')
  expect(finalBuildOptions.budgets).to.be.undefined
}
const expectGeneratesTsConfig = async (devServerConfig: AngularWebpackDevServerConfig, buildOptions: any) => {
  const { projectRoot } = devServerConfig.cypressConfig
  let tsConfigPath = await generateTsConfig(devServerConfig, buildOptions)
  const tempDir = await getTempDir(path.basename(projectRoot))

  expect(tsConfigPath).to.eq(path.join(tempDir, 'tsconfig.json'))

  let tsConfig = JSON.parse(await fs.readFile(tsConfigPath, 'utf8'))

  expect(tsConfig).to.deep.eq({
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
      toPosix(path.join(projectRoot, 'src/polyfills.ts')),
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

  expect(tsConfig).to.deep.eq({
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
