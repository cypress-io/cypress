import systemTests from '../lib/system-tests'

describe('module API', () => {
  systemTests.it('can run module API Mocha spec', {
    timeout: 240000,
    dockerImage: 'cypress/base:12',
    withBinary: true,
    project: 'module-api',
    browser: 'electron',
    command: 'yarn',
    args: ['test'],
  })
})
