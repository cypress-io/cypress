import bodyParser from 'body-parser'
import e2e from '../support/helpers/e2e'
const Fixtures = require('../support/helpers/fixtures')

const WEBPACK_PREPROCESSOR_PROJECTS = [
  'webpack-preprocessor',
  'webpack-preprocessor-ts-loader',
  'webpack-preprocessor-ts-loader-compiler-options',
  'webpack-preprocessor-awesome-typescript-loader',
]

const onServer = function (app) {
  app.use(bodyParser.json())

  return app.get('/response', (req, res) => res.json({ ok: true }))
}

const VARIOUS_FAILURES_EXPECTED_FAILURES = 61

const verifyPassedAndFailedAreSame = (expectedFailures) => {
  return ({ stdout }) => {
    const passes = stdout.match(/✓ ✓ VERIFY/g)

    expect(passes.length, 'number of passes should equal the number of failures').to.equal(expectedFailures)
  }
}

describe('e2e error ui', function () {
  e2e.setup({
    port: 1919,
    onServer,
  })

  e2e.it('displays correct UI for errors', {
    spec: 'various_failures_spec.js',
    expectedExitCode: VARIOUS_FAILURES_EXPECTED_FAILURES,
    timeout: 180000, // 3 minutes
    noTypeScript: true,
    onRun (exec) {
      return exec().then(verifyPassedAndFailedAreSame(VARIOUS_FAILURES_EXPECTED_FAILURES))
    },
  })

  e2e.it('displays correct UI for errors in custom commands', {
    spec: 'various_failures_custom_commands_spec.js',
    expectedExitCode: VARIOUS_FAILURES_EXPECTED_FAILURES,
    timeout: 180000, // 3 minutes
    noTypeScript: true,
    onRun (exec) {
      return exec().then(verifyPassedAndFailedAreSame(VARIOUS_FAILURES_EXPECTED_FAILURES))
    },
  })

  e2e.it('displays correct UI for typescript errors', {
    spec: 'various_failures_spec.ts',
    expectedExitCode: 2,
    onRun (exec) {
      return exec().then(verifyPassedAndFailedAreSame(2))
    },
  })

  WEBPACK_PREPROCESSOR_PROJECTS.forEach((project) => {
    e2e.it(`handles sourcemaps in webpack for project: ${project}`, {
      project: Fixtures.projectPath(project),
      spec: 'failing_spec.*',
      expectedExitCode: 1,
      onRun (exec) {
        return exec().then(verifyPassedAndFailedAreSame(1))
      },
    })
  })
})
