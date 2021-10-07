import e2e from '../support/helpers/e2e'
import Fixtures from '../support/helpers/fixtures'

describe('e2e typescript in spec and support file', function () {
  e2e.setup()

  it('spec passes', function () {
    return e2e.exec(this, {
      spec: 'typescript_passing_spec.ts',
      snapshot: true,
    })
  })

  it('spec fails with syntax error', function () {
    return e2e.exec(this, {
      spec: 'typescript_syntax_error_spec.ts',
      snapshot: true,
      expectedExitCode: 1,
      onStdout: e2e.normalizeWebpackErrors,
    })
  })

  it('project passes', function () {
    const projPath = Fixtures.projectPath('ts-proj')

    return e2e.exec(this, {
      project: projPath,
      snapshot: true,
    })
  })

  // this covers spec/support files as well as the plugins file
  // @see https://github.com/cypress-io/cypress/issues/7006
  // @see https://github.com/cypress-io/cypress/issues/8555
  it('respects tsconfig paths', function () {
    return e2e.exec(this, {
      project: Fixtures.projectPath('ts-proj-with-paths'),
    })
  })
})
