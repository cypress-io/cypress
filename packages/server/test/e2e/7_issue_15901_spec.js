const e2e = require('../support/helpers/e2e').default
const Fixtures = require('../support/helpers/fixtures')

// https://github.com/cypress-io/cypress/issues/15901
describe('issue 15901', () => {
  e2e.setup()

  it('does not crash', function () {
    return e2e.exec(this, {
      project: Fixtures.projectPath('issue-15901'),
      expectedExitCode: 0,
    })
  })
})
