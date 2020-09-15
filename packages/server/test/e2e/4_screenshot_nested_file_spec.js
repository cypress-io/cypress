const e2e = require('../support/helpers/e2e').default

describe('e2e screenshot in nested spec', () => {
  e2e.setup()

  e2e.it('passes', {
    spec: 'nested-1/nested-2/screenshot_nested_file_spec.coffee',
    snapshot: true,
  })
})
