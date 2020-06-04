import e2e from '../support/helpers/e2e'

const PORT = 3333

describe('e2e issue 7481', () => {
  e2e.setup({
    servers: {
      port: PORT,
    },
  })

  e2e.it('does not error loading authenticated url', {
    spec: 'simple_passing_spec.coffee',
    config: {
      baseUrl: `http://username:password@localhost:${PORT}/`,
    },
  })
})
