import systemTests from '../lib/system-tests'

describe('e2e', async () => {
  systemTests.it('passes', {
    project: 'multiple-certificates-chooseCert',
    testingType: 'e2e',
    snapshot: true,
    browser: ['electron'],
  })
})
