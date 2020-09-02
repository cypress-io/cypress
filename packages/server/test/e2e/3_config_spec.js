const e2e = require('../support/helpers/e2e').default
const Fixtures = require('../support/helpers/fixtures')

describe('e2e config', () => {
  e2e.setup({
    settings: {
      // force the default command timeout to be
      // much lower which causes our test to fail
      defaultCommandTimeout: 1000,
    },
  })

  it('provides various environment details', function () {
    return e2e.exec(this, {
      spec: 'config_passing_spec.coffee',
      snapshot: true,
      config: {
        env: {
          scriptlet: '<script>alert(\'this should not break\')</script>',
        },
      },
    })
  })

  it('applies defaultCommandTimeout globally', function () {
    // tests that config is applied correctly from modified cypress.json

    // TODO: test that environment variables and CYPRESS_config
    // work as well

    return e2e.exec(this, {
      spec: 'config_failing_spec.coffee',
      snapshot: true,
      expectedExitCode: 1,
    })
  })

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
})
