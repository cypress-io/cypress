const e2e = require('../support/helpers/e2e')
const Fixtures = require('../support/helpers/fixtures')

describe('e2e typescript', function () {
  e2e.setup({ npmInstall: true })

  it('spec passes', function () {
    return e2e.exec(this, {
      spec: 'browserify_typescript_passing_spec.ts',
      snapshot: true,
    })
  })

  it('spec fails', function () {
    return e2e.exec(this, {
      spec: 'browserify_typescript_failing_spec.ts',
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  it('project passes', function () {
    const projPath = Fixtures.projectPath('ts-proj')

    return e2e.exec(this, {
      project: projPath,
      snapshot: true,
    })
  })
})
