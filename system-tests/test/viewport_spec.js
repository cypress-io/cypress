const systemTests = require('../lib/system-tests').default

describe('e2e viewport', () => {
  systemTests.setup({
    settings: {
      viewportWidth: 800,
      viewportHeight: 600,
    },
  })

  systemTests.it('passes', {
    spec: 'viewport.cy.js',
    snapshot: true,
  })
})
