const e2e = require('../support/helpers/e2e').default

describe('e2e es modules', () => {
  e2e.setup()

  it('passes', function () {
    return e2e.exec(this, {
      spec: 'es_modules_in_coffee_spec.coffee',
      snapshot: true,
      noTypeScript: true,
    })
  })

  it('fails', function () {
    return e2e.exec(this, {
      spec: 'es_module_import_failing_spec.js',
      snapshot: true,
      expectedExitCode: 1,
      noTypeScript: true,
      onStdout: e2e.normalizeWebpackErrors,
    })
  })
})
