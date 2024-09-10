import systemTests from '../lib/system-tests'

describe('e2e', async () => {
  systemTests.it('passes', {
    project: 'multiple-certificates-selectCert',
    testingType: 'e2e',
    snapshot: true,
    browser: ['electron'],
  })
})
