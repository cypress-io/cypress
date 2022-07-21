import { scaffoldMigrationProject } from '../test-helpers/scaffoldProject'
import chai, { expect } from 'chai'
import { angularHandler, getAngularJson, getAngularCliModules, AngularJsonProjectConfig, getAngularBuildOptions, generateTsConfig, getTempDir } from '../../src/helpers/angularHandler'
import { WebpackDevServerConfig } from '../../src/devServer'
import * as path from 'path'
import * as fs from 'fs-extra'
import '../support'
import chaiPromise from 'chai-as-promised'
import cloneDeep from 'lodash/cloneDeep'

chai.use(chaiPromise)

const projectConfig: AngularJsonProjectConfig = {
  root: 'my-root',
  sourceRoot: 'my-root/src',
  projectType: 'application',
  architect: {
    build: {
      options: {
        aot: true,
        tsConfig: 'tsconfig.json',
        polyfills: 'src/polyfills.ts',
        optimization: true,
      },
      configurations: {
        development: {
          optimization: false,
        },
      },
    },
  },
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

const expectLoadsAngularBuildOptions = () => {
  const tsConfig = 'tsconfig.cypress.json'

  let buildOptions = getAngularBuildOptions(projectConfig, tsConfig)

  expect(buildOptions.aot).to.be.false
  expect(buildOptions.optimization).to.be.false
  expect(buildOptions.tsConfig).to.equal(tsConfig)

  const modifiedProjectConfig = cloneDeep(projectConfig)

  delete modifiedProjectConfig.architect.build.configurations

  buildOptions = getAngularBuildOptions(modifiedProjectConfig, tsConfig)

  expect(buildOptions.optimization).to.be.true
}

const expectGeneratesTsConfig = async (devServerConfig: WebpackDevServerConfig) => {
  const { projectRoot } = devServerConfig.cypressConfig
  let tsConfigPath = await generateTsConfig(devServerConfig, projectConfig)
  const tempDir = await getTempDir()

  expect(tsConfigPath).to.eq(path.join(tempDir, 'tsconfig.json'))

  let tsConfig = JSON.parse(await fs.readFile(tsConfigPath, 'utf8'))

  expect(tsConfig).to.deep.eq({
    extends: path.join(projectRoot, 'tsconfig.json'),
    compilerOptions: {
      outDir: path.join(projectRoot, 'out-tsc/cy'),
      allowSyntheticDefaultImports: true,
      baseUrl: projectRoot,
    },
    include: [
      path.join(projectRoot, 'src/**/*.cy.ts'),
      path.join(projectRoot, 'src/polyfills.ts'),
      path.join(projectRoot, 'node_modules/cypress/types/*.d.ts'),
    ],
  })

  const modifiedProjectConfig = cloneDeep(projectConfig)

  delete modifiedProjectConfig.architect.build.options.polyfills

  const modifiedDevServerConfig = cloneDeep(devServerConfig)
  const supportFile = path.join(projectRoot, 'cypress/support/component.ts')

  modifiedDevServerConfig.cypressConfig.supportFile = supportFile

  tsConfigPath = await generateTsConfig(modifiedDevServerConfig, modifiedProjectConfig)
  tsConfig = JSON.parse(await fs.readFile(tsConfigPath, 'utf8'))

  expect(tsConfig.include).to.deep.equal([
    path.join(projectRoot, 'src/**/*.cy.ts'),
    supportFile,
    path.join(projectRoot, 'node_modules/cypress/types/*.d.ts'),
  ])
}

describe('createReactAppHandler', function () {
  this.timeout(1000 * 60)

  it('sources the config from angular-13', async () => {
    const projectRoot = await scaffoldMigrationProject('angular-13')

    process.chdir(projectRoot)

    const devServerConfig = {
      cypressConfig: {
        projectRoot,
        specPattern: 'src/**/*.cy.ts',
      } as Cypress.PluginConfigOptions,
      framework: 'angular',
    } as WebpackDevServerConfig

    const { frameworkConfig: webpackConfig, sourceWebpackModulesResult } = await angularHandler(devServerConfig)

    expect(webpackConfig).to.exist
    expect((webpackConfig?.entry as any).main).to.be.undefined
    expect(sourceWebpackModulesResult.framework?.importPath).to.include('@angular-devkit/build-angular')

    await expectLoadsAngularJson(projectRoot)
    await expectLoadsAngularCLiModules(projectRoot)
    await expectGeneratesTsConfig(devServerConfig)
    expectLoadsAngularBuildOptions()
  })

  it('sources the config from angular-14', async () => {
    const projectRoot = await scaffoldMigrationProject('angular-14')

    process.chdir(projectRoot)

    const devServerConfig = {
      cypressConfig: {
        projectRoot,
        specPattern: 'src/**/*.cy.ts',
      } as Cypress.PluginConfigOptions,
      framework: 'angular',
    } as WebpackDevServerConfig

    const { frameworkConfig: webpackConfig, sourceWebpackModulesResult } = await angularHandler(devServerConfig)

    expect(webpackConfig).to.exist
    expect((webpackConfig?.entry as any).main).to.be.undefined
    expect(sourceWebpackModulesResult.framework?.importPath).to.include('@angular-devkit/build-angular')

    await expectLoadsAngularJson(projectRoot)
    await expectLoadsAngularCLiModules(projectRoot)
    await expectGeneratesTsConfig(devServerConfig)
    expectLoadsAngularBuildOptions()
  })
})
