import systemTests from '../lib/system-tests'

describe('module API', () => {
  systemTests.it('can run module API Mocha spec', {
    timeout: 240000,
    dockerImage: 'cypress/base-internal:24.22.1-trixie',
    withBinary: true,
    project: 'module-api',
    // `args` replaces the CLI flags, so the module API runs the default browser, Electron; the image has no other and the snapshots assert on it
    browser: 'electron',
    command: 'yarn',
    args: ['test'],
  })
})
