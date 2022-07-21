import { scaffoldMigrationProject } from '../test-helpers/scaffoldProject'
import { expect } from 'chai'
import { nuxtHandler } from '../../src/helpers/nuxtHandler'
import { WebpackDevServerConfig } from '../../src/devServer'
import '../support'

describe('nuxtHandler', function () {
  // can take a while since we install node_modules
  this.timeout(1000 * 60)

  it('sources from a nuxtjs 2 project', async () => {
    const projectRoot = await scaffoldMigrationProject('nuxtjs2')

    process.chdir(projectRoot)

    const { frameworkConfig: webpackConfig, sourceWebpackModulesResult } = await nuxtHandler({
      cypressConfig: { projectRoot } as Cypress.PluginConfigOptions,
      framework: 'nuxt',
    } as WebpackDevServerConfig)

    // Verify it's a Vue-specific webpack config by seeing if VueLoader is present.
    expect(webpackConfig.plugins.find((plug) => plug.constructor.name === 'VueLoader'))
    expect(webpackConfig.performance).to.be.undefined

    expect(sourceWebpackModulesResult.framework?.importPath).to.include('@nuxt/webpack')
    expect(sourceWebpackModulesResult.webpack.majorVersion).eq(4)
  })
})
