const e2e = require('../support/helpers/e2e').default

describe('e2e browserify, babel, es2015', () => {
  e2e.setup()

  it('passes', function () {
    return e2e.exec(this, {
      spec: 'browserify_babel_es2015_passing_spec.coffee',
      snapshot: true,
      noTypeScript: true,
    })
  })

  it('fails', function () {
    return e2e.exec(this, {
      spec: 'browserify_babel_es2015_failing_spec.js',
      snapshot: true,
      expectedExitCode: 1,
      noTypeScript: true,
    })
  })
})
