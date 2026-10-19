import systemTests from '../lib/system-tests'

describe('e2e issue 6619', () => {
  systemTests.setup()

  // this tests open mode behavior
  // when the user hits the 'reload' button in open mode
  // https://github.com/cypress-io/cypress/issues/6619
  systemTests.it('can reload during spec run', {
    spec: 'reload.spec.js',
    snapshot: true,
    // Firefox open-mode reload simulation can exceed 30s under CI load.
    timeout: 120000,
  })
})
