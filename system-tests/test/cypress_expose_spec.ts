import systemTests from '../lib/system-tests'
import path from 'path'

describe('cypress_expose', () => {
  systemTests.setup()

  systemTests.it('Hydrates Cypress.expose() from the config file', {
    project: 'cypress-expose',
    configFile: 'cypress-expose-in-config.config.ts',
    expectedExitCode: 0,
    browser: 'electron',
  })

  systemTests.it('Hydrates Cypress.expose() from the CLI via "--expose" argument', {
    expectedExitCode: 0,
    browser: 'electron',
    command: 'cypress',
    args: [
      'run',
      '--dev',
      '--project', path.resolve(process.cwd(), './projects/cypress-expose'),
      '--config-file', path.resolve(process.cwd(), './projects/cypress-expose/cypress-expose-in-cli.config.ts'),
      '--expose', 'CY_EXPOSE_FOO=foo,CY_EXPOSE_BAR=bar,CY_EXPOSE_ONE=1',
    ],
  })

  systemTests.it('Hydrates Cypress.expose() from the CLI via "-x" argument', {
    expectedExitCode: 0,
    browser: 'electron',
    command: 'cypress',
    args: [
      'run',
      '--dev',
      '--project', path.resolve(process.cwd(), './projects/cypress-expose'),
      '--config-file', path.resolve(process.cwd(), './projects/cypress-expose/cypress-expose-in-cli.config.ts'),
      '-x', 'CY_EXPOSE_FOO=foo,CY_EXPOSE_BAR=bar,CY_EXPOSE_ONE=1',
    ],
  })
})
