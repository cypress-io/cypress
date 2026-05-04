import systemTests from '../lib/system-tests'

describe('allowCypressEnv', () => {
  systemTests.setup()

  systemTests.it('throws an error when trying to use Cypress.env() with allowCypressEnv=false', {
    project: 'allow-cypress-env',
    configFile: 'cypress-without-allow-cypress-env.config.ts',
    snapshot: true,
    expectedExitCode: 1,
    browser: 'electron',
  })

  systemTests.it('correctly prints a warning when trying to use Cypress.env() with allowCypressEnv=true', {
    project: 'allow-cypress-env',
    configFile: 'cypress-with-allow-cypress-env.config.ts',
    snapshot: true,
    expectedExitCode: 0,
    browser: 'electron',
    async onRun (exec) {
      const res = await exec()

      // verify the error actually exists within the stdout in addition to a snapshot
      expect(res.stdout).to.contain('The allowCypressEnv configuration option is enabled.')
      expect(res.stdout).to.contain('This allows any browser code to read values from Cypress.env().')
      expect(res.stdout).to.contain('This is insecure and will be removed in a future major version.')
      expect(res.stdout).to.contain('Learn more: https://on.cypress.io/cypress-env-migration')
    },
  })
})
