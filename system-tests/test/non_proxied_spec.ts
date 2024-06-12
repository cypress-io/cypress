import systemTests from '../lib/system-tests'

describe('e2e non-proxied spec', () => {
  systemTests.setup()

  systemTests.it('passes', {
    spec: 'spec.cy.js',
    browser: 'chrome',
    project: 'non-proxied',
    snapshot: true,
  })
})
