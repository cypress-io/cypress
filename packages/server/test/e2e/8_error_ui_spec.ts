const bodyParser = require('body-parser')
const e2e = require('../support/helpers/e2e')

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
})
