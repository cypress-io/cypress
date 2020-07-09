import snapshot from 'snap-shot-it'

import e2e from '../support/helpers/e2e'
import Fixtures from '../support/helpers/fixtures'

describe('e2e typescript', function () {
  e2e.setup()

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

  it('handles tsconfig with module other than commonjs', function () {
    const projPath = Fixtures.projectPath('ts-proj-with-own-tsconfig')

    return e2e.exec(this, {
      project: projPath,
      config: {
        video: false,
      },
    }).then((result) => {
      const runSummary = e2e.leaveRunFinishedTable(e2e.normalizeStdout(result.stdout))

      snapshot('typescript with tsconfig run', runSummary)
    })
  })
})
