import { scaffoldMigrationProject } from '../test-helpers/scaffoldProject'
import { expect } from 'chai'
import { nuxtHandler } from '../../src/helpers/nuxtHandler'

describe('nuxtHandler', function () {
  // can take a while since we install node_modules
  this.timeout(1000 * 60)

  it('sources from a nuxtjs 2 project', async () => {
    const projectRoot = await scaffoldMigrationProject('nuxtjs2')

    process.chdir(projectRoot)

    const config = await nuxtHandler({
      devServerConfig: {
        cypressConfig: { projectRoot } as Cypress.PluginConfigOptions,
      },
    } as any)

    // Verify it's a Vue-specific webpack config by seeing if VueLoader is present.
    expect(config.plugins.find((plug) => plug.constructor.name === 'VueLoader'))
    expect(config.performance).to.be.undefined
  })
})
