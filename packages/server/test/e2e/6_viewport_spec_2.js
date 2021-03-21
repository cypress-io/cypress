const e2e = require('../support/helpers/e2e').default
const Fixtures = require('../support/helpers/fixtures')

const project = Fixtures.projectPath('component-tests')

describe('e2e viewport', () => {
  e2e.setup({
    settings: {
      viewportWidth: 800,
      viewportHeight: 600,
      // env: {
      //   DEBUG: 'cypress:webpack-dev-server:*'
      // }
    },
  })

  e2e.it('passes', {
    // spec: 'viewport_spec.js',
    browser: 'chrome',
    snapshot: true,
    testingType: 'component',
    project,
  })
})
