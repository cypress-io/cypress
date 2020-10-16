import e2e from '../support/helpers/e2e'

describe('e2e issue 173', () => {
  e2e.setup()

  // https://github.com/cypress-io/cypress/issues/173
  e2e.it('failing', {
    spec: 'issue_173_spec.coffee',
    snapshot: true,
    expectedExitCode: 1,
  })
})
