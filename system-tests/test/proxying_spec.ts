import systemTests from '../lib/system-tests'

describe('e2e proxying spec', () => {
  systemTests.setup({
    servers: {
      port: 7878,
      static: true,
      cors: true,
      https: true,
    },
  })

  systemTests.it('integrity check', {
    spec: 'proxying.cy.js',
  })
})
