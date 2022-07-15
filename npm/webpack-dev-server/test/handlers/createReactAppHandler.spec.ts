import { scaffoldMigrationProject } from '../test-helpers/scaffoldProject'
import { expect } from 'chai'
import { createReactAppHandler, cypressGlobals } from '../../src/helpers/createReactAppHandler'
import { WebpackDevServerConfig } from '../../src/devServer'
import { Configuration } from 'webpack'
import * as path from 'path'
import '../support'

const expectEslintModifications = (webpackConfig: Configuration) => {
  const eslintPlugin: any = webpackConfig.plugins?.find((plugin) => plugin.constructor.name === 'ESLintWebpackPlugin')

  if (!eslintPlugin) {
    throw new Error('Expected to find ESLintWebpackPlugin in webpack config')
  }

  cypressGlobals.forEach((global) => expect(global in eslintPlugin.options.baseConfig.globals).to.be.true)
}

const expectModuleSourceInPlaceModifications = (webpackConfig: Configuration, projectRoot: string) => {
  const moduleSourcePlugin: any = webpackConfig.resolve.plugins.find((plugin) => plugin.constructor.name === 'ModuleScopePlugin')

  if (!moduleSourcePlugin) {
    throw new Error('Expected to find ModuleScopePlugin in webpack config')
  }

  expect(moduleSourcePlugin.appSrcs).to.contain(path.join(projectRoot, 'cypress'))
}

const expectBabelRuleModifications = (webpackConfig: Configuration, projectRoot: string) => {
  const babelRule: any = (webpackConfig.module.rules as any).find((rule) => rule.oneOf)?.oneOf.find((oneOf) => oneOf.loader?.includes('babel-loader'))

  if (!babelRule) {
    throw new Error('Expected to find BabelRule in webpack config')
  }

  expect(babelRule.include).to.contain(path.join(projectRoot, 'cypress'))
}

const expectReactScriptsFiveModifications = (webpackConfig: Configuration) => {
  const definePlugin: any = webpackConfig.plugins.find((plugin) => plugin.constructor.name === 'DefinePlugin')

  if (!definePlugin) {
    throw new Error('Expected to find DefinePlugin in webpack config')
  }

  expect(process.env.BROWSERSLIST_ENV).eq('development')
  expect(definePlugin.definitions['process.env']).to.have.property('NODE_ENV', JSON.stringify('development'))
}

describe('createReactAppHandler', function () {
  this.timeout(1000 * 60)

  it('sources the config from react-scripts v4', async () => {
    const projectRoot = await scaffoldMigrationProject('cra-4')

    process.chdir(projectRoot)

    const { frameworkConfig: webpackConfig, sourceWebpackModulesResult } = createReactAppHandler({
      cypressConfig: { projectRoot } as Cypress.PluginConfigOptions,
      framework: 'create-react-app',
    } as WebpackDevServerConfig)

    expect(webpackConfig.mode).eq('development')
    expectEslintModifications(webpackConfig)
    expectModuleSourceInPlaceModifications(webpackConfig, projectRoot)
    expectBabelRuleModifications(webpackConfig, projectRoot)

    expect(sourceWebpackModulesResult.framework?.importPath).to.include('react-scripts')
    expect(sourceWebpackModulesResult.webpack.majorVersion).eq(4)
  })

  it('sources the config from react-scripts v5', async () => {
    const projectRoot = await scaffoldMigrationProject('cra-5')

    process.chdir(projectRoot)

    const { frameworkConfig: webpackConfig, sourceWebpackModulesResult } = createReactAppHandler({
      cypressConfig: { projectRoot } as Cypress.PluginConfigOptions,
      framework: 'create-react-app',
    } as WebpackDevServerConfig)

    expect(webpackConfig.mode).eq('development')
    expectEslintModifications(webpackConfig)
    expectModuleSourceInPlaceModifications(webpackConfig, projectRoot)
    expectBabelRuleModifications(webpackConfig, projectRoot)
    expectReactScriptsFiveModifications(webpackConfig)

    expect(sourceWebpackModulesResult.framework?.importPath).to.include('react-scripts')
    expect(sourceWebpackModulesResult.webpack.majorVersion).eq(5)
  })

  it('sources the config from ejected cra', async () => {
    const projectRoot = await scaffoldMigrationProject('cra-ejected')

    process.chdir(projectRoot)

    const { frameworkConfig: webpackConfig, sourceWebpackModulesResult } = createReactAppHandler({
      cypressConfig: { projectRoot } as Cypress.PluginConfigOptions,
      framework: 'create-react-app',
    } as WebpackDevServerConfig)

    expect(webpackConfig.mode).eq('development')
    expectEslintModifications(webpackConfig)
    expectModuleSourceInPlaceModifications(webpackConfig, projectRoot)
    expectBabelRuleModifications(webpackConfig, projectRoot)
    expectReactScriptsFiveModifications(webpackConfig)

    expect(sourceWebpackModulesResult.framework).to.be.null
    expect(sourceWebpackModulesResult.webpack.majorVersion).eq(5)
  })
})
