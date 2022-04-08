import { scaffoldMigrationProject } from '../test-helpers/scaffoldProject'
import { expect } from 'chai'
import { vueCliHandler } from '../../src/helpers/vueCliHandler'

describe('vueCliHandler', function () {
  // can take a while since we install node_modules
  this.timeout(1000 * 60)

  it('sources from a @vue/cli-service@5.x project with Vue 3', async () => {
    const projectRoot = await scaffoldMigrationProject('vuecli5-vue3')

    process.chdir(projectRoot)

    const config = vueCliHandler({
      devServerConfig: {
        cypressConfig: { projectRoot } as Cypress.PluginConfigOptions,
      },
    } as any)

    // Verify it's a Vue-specific webpack config by seeing if VueLoader is present.
    expect(config.plugins.find((plug) => plug.constructor.name === 'VueLoader'))
  })

  it('sources from a @vue/cli-service@4.x project with Vue 2', async () => {
    const projectRoot = await scaffoldMigrationProject('vuecli4-vue2')

    process.chdir(projectRoot)

    const config = vueCliHandler({
      devServerConfig: {
        cypressConfig: { projectRoot } as Cypress.PluginConfigOptions,
      },
    } as any)

    // Verify it's a Vue-specific webpack config by seeing if VueLoader is present.
    expect(config.plugins.find((plug) => plug.constructor.name === 'VueLoader'))
  })
})
