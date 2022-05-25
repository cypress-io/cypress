const systemTests = require('../lib/system-tests').default

describe('e2e images', () => {
  systemTests.setup({
    servers: {
      port: 3636,
      static: true,
    },
  })

  // this tests that images are correctly proxied and that we are not
  // accidentally modifying their bytes in the stream
  systemTests.it('passes', {
    spec: 'images.cy.js',
    snapshot: true,
  })
})
