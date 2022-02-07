const systemTests = require('../lib/system-tests').default

const hosts = {
  'app.localhost': '127.0.0.1',
  'foo.bar.baz.com.au': '127.0.0.1',
}

describe('e2e domain', () => {
  systemTests.setup({
    servers: {
      port: 4848,
      static: true,
    },
  })

  systemTests.it('passes', {
    spec: 'domain*',
    snapshot: true,
    video: false,
    config: {
      hosts,
    },
  })
})
