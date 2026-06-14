const systemTests = require('../lib/system-tests').default

describe('e2e async commands', () => {
  systemTests.setup()

  // https://github.com/cypress-io/cypress/issues/4742
  // The first test fails (a command assertion fails after an await), the second
  // passes - proving async test bodies await the command queue.
  systemTests.it('failing', {
    spec: 'async_commands.cy.js',
    snapshot: true,
    expectedExitCode: 1,
  })
})
