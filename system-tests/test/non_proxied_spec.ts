import systemTests from '../lib/system-tests'

describe('e2e non-proxied spec', () => {
  systemTests.setup()

  systemTests.it('passes', {
    spec: 'spec.cy.js',
    config: {
      video: false,
    },
    browser: 'chrome',
    project: 'non-proxied',
    snapshot: true,
  })
})
