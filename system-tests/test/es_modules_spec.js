const systemTests = require('../lib/system-tests').default

describe('e2e es modules', () => {
  systemTests.setup()

  it('passes', function () {
    return systemTests.exec(this, {
      project: 'coffee-react-interop',
      spec: 'es_modules_in_coffee_spec.coffee',
      snapshot: true,
      noTypeScript: true,
    })
  })

  it('fails', function () {
    return systemTests.exec(this, {
      spec: 'es_module_import_failing.cy.js',
      snapshot: true,
      expectedExitCode: 1,
      noTypeScript: true,
      onStdout: systemTests.normalizeWebpackErrors,
    })
  })
})
