import systemTests from '../lib/system-tests'

describe('e2e issue 6619', () => {
  systemTests.setup()

  // this tests open mode behavior
  // when the user hits the 'reload' button in open mode
  // https://github.com/cypress-io/cypress/issues/6619
  systemTests.it('can reload during spec run', {
    spec: 'reload-spec.spec.js',
    snapshot: true,
    timeout: 30000,
  })
})
