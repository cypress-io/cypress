const systemTests = require('../lib/system-tests').default

describe('e2e screenshot in nested spec', () => {
  systemTests.setup()

  systemTests.it('passes', {
    spec: 'nested-1/nested-2/screenshot_nested_file.cy.js',
    snapshot: true,
  })
})
