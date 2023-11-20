import systemTests from '../lib/system-tests'

describe('e2e headed', function () {
  systemTests.setup()

  systemTests.it(`runs multiple specs in headed mode`, {
    project: 'e2e',
    headed: true,
    spec: 'a_record.cy.js,b_record.cy.js,simple_passing.cy.js',
    expectedExitCode: 0,
  })
})
