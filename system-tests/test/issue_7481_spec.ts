import systemTests from '../lib/system-tests'

const PORT = 3333

describe('e2e issue 7481', () => {
  systemTests.setup({
    servers: {
      port: PORT,
    },
  })

  systemTests.it('does not error loading authenticated url', {
    spec: 'simple_passing.cy.js',
    config: {
      baseUrl: `http://username:password@localhost:${PORT}/`,
    },
  })
})
