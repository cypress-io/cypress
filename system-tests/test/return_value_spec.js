const systemTests = require('../lib/system-tests').default

describe('e2e return value', () => {
  systemTests.setup()

  it('failing1', function () {
    return systemTests.exec(this, {
      spec: 'return_value.cy.js',
      snapshot: true,
      expectedExitCode: 3,
    })
  })
})
