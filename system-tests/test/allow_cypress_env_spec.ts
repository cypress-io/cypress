import systemTests from '../lib/system-tests'

describe('allowCypressEnv removal', () => {
  systemTests.setup()

  systemTests.it('warns when allowCypressEnv is set in config', {
    project: 'allow-cypress-env',
    configFile: 'cypress-with-allow-cypress-env.config.ts',
    snapshot: true,
    expectedExitCode: 0,
    browser: 'electron',
    async onRun (exec) {
      const res = await exec()

      expect(res.stdout).to.contain('The allowCypressEnv configuration option was removed')
      expect(res.stdout).to.contain('Cypress.env() has been removed')
      expect(res.stdout).to.contain('Learn more: https://on.cypress.io/cypress-env-migration')
    },
  })

  systemTests.it('does not expose Cypress.env in the browser', {
    project: 'allow-cypress-env',
    configFile: 'cypress-without-allow-cypress-env.config.ts',
    snapshot: true,
    expectedExitCode: 0,
    browser: 'electron',
  })
})
