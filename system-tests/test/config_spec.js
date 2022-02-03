const systemTests = require('../lib/system-tests').default
const { fs } = require('@packages/server/lib/util/fs')
const path = require('path')
const Fixtures = require('../lib/fixtures')

describe('e2e config', () => {
  systemTests.setup()

  it('provides various environment details', function () {
    return systemTests.exec(this, {
      spec: 'config_passing.cy.js',
      snapshot: true,
      config: {
        env: {
          scriptlet: '<script>alert(\'this should not break\')</script>',
        },
      },
    })
  })

  it('applies defaultCommandTimeout globally', function () {
    return systemTests.exec(this, {
      project: 'config-with-short-timeout',
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  // TODO: test that environment variables and CYPRESS_config work as well

  it('throws error when invalid viewportWidth in the configuration file', function () {
    return systemTests.exec(this, {
      project: 'config-with-invalid-viewport',
      expectedExitCode: 1,
      snapshot: true,
    })
  })

  it('throws error when invalid browser in the configuration file', function () {
    return systemTests.exec(this, {
      project: 'config-with-invalid-browser',
      expectedExitCode: 1,
      snapshot: true,
    })
  })

  it('supports global shadow dom inclusion', function () {
    return systemTests.exec(this, {
      project: 'shadow-dom-global-inclusion',
    })
  })

  it('supports custom configFile in JavaScript', function () {
    return systemTests.exec(this, {
      project: 'config-with-custom-file-js',
      configFile: 'cypress.config.custom.js',
    })
  })

  it('supports custom configFile in TypeScript', function () {
    return systemTests.exec(this, {
      project: 'config-with-custom-file-ts',
      configFile: 'cypress.config.custom.ts',
    })
  })

  it('supports custom configFile in a default JavaScript file', function () {
    return systemTests.exec(this, {
      project: 'config-with-js',
    })
  })

  it('supports custom configFile in a default TypeScript file', function () {
    return systemTests.exec(this, {
      project: 'config-with-ts',
    })
  })

  it('throws error when multiple default config file are found in project', function () {
    Fixtures.scaffoldProject('pristine-with-e2e-testing')
    const projectRoot = Fixtures.projectPath('pristine-with-e2e-testing')

    return fs.writeFile(path.join(projectRoot, 'cypress.config.ts'), 'export default {}').then(() => {
      return systemTests.exec(this, {
        project: 'pristine-with-e2e-testing',
        expectedExitCode: 1,
        snapshot: true,
      })
    })
  })

  it('throws error when cypress.json is found in project and need migration', function () {
    Fixtures.scaffoldProject('pristine')
    const projectRoot = Fixtures.projectPath('pristine')

    return fs.writeFile(path.join(projectRoot, 'cypress.json'), '{}').then(() => {
      return systemTests.exec(this, {
        project: 'pristine',
        expectedExitCode: 1,
        snapshot: true,
      })
    })
  })

  it('throws error when cypress.json is found in project and cypress.config.{ts|js} exists as well', function () {
    Fixtures.scaffoldProject('multiple-config-files-with-json')
    Fixtures.projectPath('multiple-config-files-with-json')

    return systemTests.exec(this, {
      project: 'multiple-config-files-with-json',
      expectedExitCode: 1,
      snapshot: true,
    })
  })
})
