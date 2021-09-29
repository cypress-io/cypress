const e2e = require('../support/helpers/e2e').default
const { fs } = require('../../lib/util/fs')
const path = require('path')
const Fixtures = require('../support/helpers/fixtures')

describe('e2e config', () => {
  e2e.setup()

  it('provides various environment details', function () {
    return e2e.exec(this, {
      spec: 'config_passing_spec.js',
      snapshot: true,
      config: {
        env: {
          scriptlet: '<script>alert(\'this should not break\')</script>',
        },
      },
    })
  })

  it('applies defaultCommandTimeout globally', function () {
    return e2e.exec(this, {
      project: Fixtures.projectPath('config-with-short-timeout'),
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  // TODO: test that environment variables and CYPRESS_config work as well

  it('throws error when invalid viewportWidth in the configuration file', function () {
    return e2e.exec(this, {
      project: Fixtures.projectPath('config-with-invalid-viewport'),
      expectedExitCode: 1,
      snapshot: true,
    })
  })

  it('throws error when invalid browser in the configuration file', function () {
    return e2e.exec(this, {
      project: Fixtures.projectPath('config-with-invalid-browser'),
      expectedExitCode: 1,
      snapshot: true,
    })
  })

  it('supports global shadow dom inclusion', function () {
    return e2e.exec(this, {
      project: Fixtures.projectPath('shadow-dom-global-inclusion'),
    })
  })

  it('supports custom configFile in JavaScript', function () {
    return e2e.exec(this, {
      project: Fixtures.projectPath('config-with-custom-file-js'),
      configFile: 'cypress.config.custom.js',
    })
  })

  it('supports custom configFile in TypeScript', function () {
    return e2e.exec(this, {
      project: Fixtures.projectPath('config-with-custom-file-ts'),
      configFile: 'cypress.config.custom.ts',
    })
  })

  it('supports custom configFile in a default JavaScript file', function () {
    return e2e.exec(this, {
      project: Fixtures.projectPath('config-with-js'),
    })
  })

  it('supports custom configFile in a default TypeScript file', function () {
    return e2e.exec(this, {
      project: Fixtures.projectPath('config-with-ts'),
    })
  })

  it('throws error when multiple default config file are found in project', function () {
    const projectRoot = Fixtures.projectPath('pristine')

    return Promise.all([
      fs.writeFile(path.join(projectRoot, 'cypress.config.js'), 'module.exports = {}'),
      fs.writeFile(path.join(projectRoot, 'cypress.config.ts'), 'export default {}'),
    ]).then(() => {
      return e2e.exec(this, {
        project: projectRoot,
        expectedExitCode: 1,
        snapshot: true,
      })
    })
  })
})
