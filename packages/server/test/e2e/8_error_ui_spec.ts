const bodyParser = require('body-parser')
const e2e = require('../support/helpers/e2e')
const Fixtures = require('../support/helpers/fixtures')

const onServer = function (app) {
  app.use(bodyParser.json())

  return app.get('/response', (req, res) => res.json({ ok: true }))
}

const EXPECTED_FAILURES = 61

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
    expectedExitCode: EXPECTED_FAILURES,
    noTypeScript: true,
    onRun (exec) {
      return exec().then(verifyPassedAndFailedAreSame(EXPECTED_FAILURES))
    },
  })

  e2e.it('displays correct UI for errors in custom commands', {
    spec: 'various_failures_custom_commands_spec.js',
    expectedExitCode: EXPECTED_FAILURES,
    noTypeScript: true,
    onRun (exec) {
      return exec().then(verifyPassedAndFailedAreSame(EXPECTED_FAILURES))
    },
  })

  e2e.it('displays correct UI for typescript errors', {
    spec: 'various_failures_spec.ts',
    expectedExitCode: 2,
    onRun (exec) {
      return exec().then(verifyPassedAndFailedAreSame(2))
    },
  })

  // FIXME: this doesn't currently work. even though webpack is put into watch
  // mode and set with devtool: 'inline-source-map', it doesn't output a
  // source map and it doesn't use the webpack:/// protocol
  // also, the test itself needs to be updated to click the error file path
  // links and test they open the correct path
  e2e.it.skip('handles webpack default protocol', {
    project: Fixtures.projectPath('webpack-preprocessor'),
    spec: 'failing_spec.ts',
    expectedExitCode: 1,
    config: {
      env: {
        CYPRESS_INTERNAL_FORCE_FILEWATCH: '1',
      },
    },
  })
})
