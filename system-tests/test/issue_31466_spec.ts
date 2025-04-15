import systemTests from '../lib/system-tests'

describe('e2e issue 31466: cy.press only works in the first spec in firefox', () => {
  systemTests.setup()

  systemTests.it('does not error when dispatching cy.press', {
    spec: 'first_spec.cy.js,second_spec.cy.js',
    project: 'cy-press-second-spec-error',
    expectedExitCode: 0,
    browser: 'firefox',
  })
})
