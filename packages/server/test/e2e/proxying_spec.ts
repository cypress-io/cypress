import e2e from '../support/helpers/e2e'

describe('e2e proxying spec', () => {
  e2e.setup({
    servers: {
      port: 7878,
      static: true,
      cors: true,
      https: true,
    },
  })

  e2e.it('integrity check', {
    spec: 'proxying_spec.js',
  })
})
