const e2e = require('../support/helpers/e2e').default

describe('e2e images', () => {
  e2e.setup({
    servers: {
      port: 3636,
      static: true,
    },
  })

  // this tests that images are correctly proxied and that we are not
  // accidentally modifying their bytes in the stream
  e2e.it('passes', {
    spec: 'images_spec.coffee',
    snapshot: true,
  })
})
