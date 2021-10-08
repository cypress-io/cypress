const e2e = require('../support/helpers/e2e').default

describe('e2e issue 1669', () => {
  e2e.setup()

  // https://github.com/cypress-io/cypress/issues/1669
  it('passes', function () {
    return e2e.exec(this, {
      spec: 'issue_1669_spec.js',
      snapshot: true,
      browser: 'chrome',
      expectedExitCode: 1,
    })
  })
})
