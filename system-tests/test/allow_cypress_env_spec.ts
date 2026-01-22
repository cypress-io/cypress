import systemTests from '../lib/system-tests'

describe('allowCypressEnv', () => {
  systemTests.setup()

  systemTests.it('throws an error when trying to use Cypress.env() with allowCypressEnv=false', {
    project: 'allow-cypress-env',
    configFile: 'cypress-with-allow-cypress-env.config.ts',
    snapshot: true,
    expectedExitCode: 1,
    browser: 'electron',
  })

  systemTests.it('correctly prints a warning when trying to use Cypress.env() with allowCypressEnv=true', {
    project: 'allow-cypress-env',
    configFile: 'cypress-without-allow-cypress-env.config.ts',
    snapshot: true,
    expectedExitCode: 0,
    browser: 'electron',
    async onRun (exec) {
      const res = await exec()

      // verify the error actually exists within the stdout in addition to a snapshot
      expect(res.stdout).to.contain('The use of Cypress.env() is deprecated and will be removed in a future major version of Cypress')
      expect(res.stdout).to.contain('Cypress recommends migrating to the cy.env() command and disabling allowCypressEnv within your Cypress configuration.')
      expect(res.stdout).to.contain('The use of Cypress.env() will warn and throw an error when allowCypressEnv is explicitly set to false.')
      expect(res.stdout).to.contain('Read our Migration Guide for the allowCypressEnv configuration option, why Cypress.env() is deprecated, and how to migrate to cy.env(): https://on.cypress.io/cypress-env-migration.')
    },
  })
})
