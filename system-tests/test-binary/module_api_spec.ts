import systemTests from '../lib/system-tests'

describe('module API', () => {
  systemTests.it('can run module API Mocha spec', {
    timeout: 240000,
    dockerImage: 'cypress/base-internal:20.18.1-bullseye',
    withBinary: true,
    project: 'module-api',
    browser: 'electron',
    command: 'yarn',
    args: ['test'],
  })
})
