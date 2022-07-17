import { scaffoldMigrationProject } from '../test-helpers/scaffoldProject'
import { expect } from 'chai'
import { vueCliHandler } from '../../src/helpers/vueCliHandler'
import { WebpackDevServerConfig } from '../../src/devServer'
import '../support'

describe('vueCliHandler', function () {
  // can take a while since we install node_modules
  this.timeout(1000 * 60)

  it('sources from a @vue/cli-service@5.x project with Vue 3', async () => {
    const projectRoot = await scaffoldMigrationProject('vuecli5-vue3')

    process.chdir(projectRoot)

    const { frameworkConfig: webpackConfig, sourceWebpackModulesResult } = vueCliHandler({
      cypressConfig: { projectRoot } as Cypress.PluginConfigOptions,
      framework: 'vue-cli',
    } as WebpackDevServerConfig)

    // Verify it's a Vue-specific webpack config by seeing if VueLoader is present.
    expect(webpackConfig.plugins.find((plug) => plug.constructor.name === 'VueLoader'))

    expect(sourceWebpackModulesResult.framework?.importPath).to.include('@vue/cli-service')
    expect(sourceWebpackModulesResult.webpack.majorVersion).eq(5)
  })

  it('sources from a @vue/cli-service@4.x project with Vue 2', async () => {
    const projectRoot = await scaffoldMigrationProject('vuecli4-vue2')

    process.chdir(projectRoot)

    const { frameworkConfig: webpackConfig, sourceWebpackModulesResult } = vueCliHandler({
      cypressConfig: { projectRoot } as Cypress.PluginConfigOptions,
      framework: 'vue-cli',
    } as WebpackDevServerConfig)

    // Verify it's a Vue-specific webpack config by seeing if VueLoader is present.
    expect(webpackConfig.plugins.find((plug) => plug.constructor.name === 'VueLoader'))

    expect(sourceWebpackModulesResult.framework?.importPath).to.include('@vue/cli-service')
    expect(sourceWebpackModulesResult.webpack.majorVersion).eq(4)
  })
})
