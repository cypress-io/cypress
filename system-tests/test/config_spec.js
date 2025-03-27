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

  it('throws error when multiple default config file are found in project', async function () {
    await Fixtures.scaffoldProject('pristine-with-e2e-testing')

    const projectRoot = Fixtures.projectPath('pristine-with-e2e-testing')

    return fs.writeFile(path.join(projectRoot, 'cypress.config.ts'), 'export default {}').then(() => {
      return systemTests.exec(this, {
        project: 'pristine-with-e2e-testing',
        expectedExitCode: 1,
        snapshot: true,
      })
    })
  })

  it('throws error when cypress.json is found in project and need migration', async function () {
    await Fixtures.scaffoldProject('pristine')

    const projectRoot = Fixtures.projectPath('pristine')

    return fs.writeFile(path.join(projectRoot, 'cypress.json'), '{}').then(() => {
      return systemTests.exec(this, {
        project: 'pristine',
        expectedExitCode: 1,
        snapshot: true,
      })
    })
  })

  it('throws error when cypress.json is found in project and cypress.config.{js,ts,mjs,cjs} exists as well', async function () {
    await Fixtures.scaffoldProject('multiple-config-files-with-json')

    return systemTests.exec(this, {
      project: 'multiple-config-files-with-json',
      expectedExitCode: 1,
      snapshot: true,
    })
  })

  it('throws an error if supportFile is set on the root level', async function () {
    await Fixtures.scaffoldProject('invalid-root-level-config')

    return systemTests.exec(this, {
      project: 'invalid-root-level-config',
      configFile: 'invalid-supportFile.config.js',
      expectedExitCode: 1,
      snapshot: true,
    })
  })

  it('throws an error if cypress.env.json specifies invalid property', async function () {
    await Fixtures.scaffoldProject('invalid-env-file')

    return systemTests.exec(this, {
      project: 'invalid-env-file',
      expectedExitCode: 1,
      snapshot: true,
    })
  })

  it('throws an error if specPattern is set on the root level', async function () {
    await Fixtures.scaffoldProject('invalid-root-level-config')

    return systemTests.exec(this, {
      project: 'invalid-root-level-config',
      configFile: 'invalid-specPattern.config.js',
      expectedExitCode: 1,
      snapshot: true,
    })
  })

  it('throws an error if excludeSpecPattern is set on the root level', async function () {
    await Fixtures.scaffoldProject('invalid-root-level-config')

    return systemTests.exec(this, {
      project: 'invalid-root-level-config',
      configFile: 'invalid-excludeSpecPattern.config.js',
      expectedExitCode: 1,
      snapshot: true,
    })
  })

  it('throws an error if baseUrl is set on the root level', async function () {
    await Fixtures.scaffoldProject('invalid-root-level-config')

    return systemTests.exec(this, {
      project: 'invalid-root-level-config',
      configFile: 'invalid-baseUrl-config.js',
      expectedExitCode: 1,
      snapshot: true,
    })
  })

  it('throws an error if baseUrl is set on the component level', async function () {
    await Fixtures.scaffoldProject('invalid-root-level-config')

    return systemTests.exec(this, {
      project: 'invalid-root-level-config',
      configFile: 'invalid-component-baseUrl-config.js',
      testingType: 'component',
      expectedExitCode: 1,
      snapshot: true,
    })
  })

  it('throws an error if indexHtml is set on the root level', async function () {
    await Fixtures.scaffoldProject('invalid-root-level-config')

    return systemTests.exec(this, {
      project: 'invalid-root-level-config',
      configFile: 'invalid-indexHtmlFile-config.js',
      expectedExitCode: 1,
      snapshot: true,
    })
  })

  it('throws an error if indexHtml is set on the e2e level', async function () {
    await Fixtures.scaffoldProject('invalid-root-level-config')

    return systemTests.exec(this, {
      project: 'invalid-root-level-config',
      configFile: 'invalid-e2e-indexHtmlFile-config.js',
      testingType: 'e2e',
      expectedExitCode: 1,
      snapshot: true,
    })
  })

  it('throws an error if testFiles is set on the config file', async function () {
    await Fixtures.scaffoldProject('invalid-root-level-config')

    return systemTests.exec(this, {
      project: 'invalid-root-level-config',
      configFile: 'invalid-testFiles-config.js',
      expectedExitCode: 1,
      snapshot: true,
    })
  })

  it('setupNodeEvents modify specPattern for current testing type', async function () {
    await Fixtures.scaffoldProject('e2e')

    return systemTests.exec(this, {
      project: 'e2e',
      configFile: 'cypress-setupNodeEvents-modify-config.config.js',
      snapshot: true,
    })
  })

  it('throws an error if componentFolder is set on the config file', async function () {
    await Fixtures.scaffoldProject('invalid-root-level-config')

    return systemTests.exec(this, {
      project: 'invalid-root-level-config',
      configFile: 'invalid-componentFolder-config.js',
      expectedExitCode: 1,
      snapshot: true,
    })
  })

  it('finds supportFiles in projects containing glob syntax', async function () {
    await Fixtures.scaffoldProject('project-with-(glob)-[chars]')

    return systemTests.exec(this, {
      project: 'project-with-(glob)-[chars]',
      snapshot: true,
    })
  })

  it('launches browser using config.defaultBrowser', async function () {
    await Fixtures.scaffoldProject('config-defaultBrowser')

    return systemTests.exec(this, {
      project: 'config-defaultBrowser',
      command: 'cypress',
      args: ['run', '--dev', '--project', path.resolve(process.cwd(), './projects/config-defaultBrowser')],
      onStdout: (stdout) => {
        expect(stdout).to.include('Browser:        Chrome')
      },
    })
  })
})
