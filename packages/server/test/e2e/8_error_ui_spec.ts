const bodyParser = require('body-parser')
const e2e = require('../support/helpers/e2e')

const onServer = function (app) {
  app.use(bodyParser.json())

  return app.get('/response', (req, res) => res.json({ ok: true }))
}

const expectedFailures = 48

const verifyPassedAndFailedAreSame = function ({ code, stdout }) {
  const passes = stdout.match(/✓ ✓ VERIFY/g)

  expect(code).to.equal(expectedFailures)

  return expect(passes.length).to.equal(expectedFailures)
}

describe('e2e reporters', function () {
  e2e.setup({
    port: 1919,
    onServer,
  })

  it('displays correct UI for errors', function () {
    return e2e.exec(this, {
      spec: 'various_failures_spec.js',
      expectedExitCode: expectedFailures,
    })
    .then(verifyPassedAndFailedAreSame)
  })

  return it('displays correct UI for errors in custom commands', function () {
    return e2e.exec(this, {
      spec: 'various_failures_custom_commands_spec.js',
      expectedExitCode: expectedFailures,
    })
    .then(verifyPassedAndFailedAreSame)
  })
})
