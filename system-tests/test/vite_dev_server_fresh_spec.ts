import systemTests from '../lib/system-tests'

describe('@cypress/vite-dev-server', function () {
  systemTests.setup()

  describe('react', () => {
    systemTests.it('runs specs in vite 2.8.6', {
      project: 'vite2.8.6-react',
      testingType: 'component',
      browser: 'chrome',
      spec: null,
      configFile: 'cypress-vite.config.ts',
      expectedExitCode: 2,
      snapshot: true,
    })

    systemTests.it('runs specs in vite 2.9.1', {
      project: 'vite2.8.6-react',
      testingType: 'component',
      browser: 'chrome',
      spec: null,
      configFile: 'cypress-vite.config.ts',
      expectedExitCode: 2,
      snapshot: true,
    })
  })
})
