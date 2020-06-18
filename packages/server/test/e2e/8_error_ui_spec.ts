import bodyParser from 'body-parser'
import e2e from '../support/helpers/e2e'
import Fixtures from '../support/helpers/fixtures'

const onServer = function (app) {
  app.use(bodyParser.json())

  return app.get('/response', (req, res) => res.json({ ok: true }))
}

const verifyPassesAndFailures = ({ stdout }) => {
  let failureMessage = ''

  const passedFailures = stdout.match(/✓ \d+\) ✗ FAIL - .*?\n/g)

  if (passedFailures) {
    failureMessage += `
The following were passes that should have failed:

- ${passedFailures.join('\n- ')}`
  }

  const failedVerifications = stdout.match(/\d+\) ✓ VERIFY - .*?\n/g)

  if (failedVerifications) {
    failureMessage += `
The following were verifications that should have passed:

- ${failedVerifications.join('\n- ')}`
  }

  if (!failureMessage) return

  const err = new Error(`

These tests rely on failing tests paired with passing tests that verify the errors for the failures are correct.
However, tests passed that should have failed and/or tests passed that should have failed.\n${failureMessage}`)

  err.name = 'AssertionError'

  throw err
}

describe('e2e error ui', function () {
  e2e.setup({
    port: 1919,
    onServer,
  })

  // these tests are broken up so they don't take too long and time out
  ;[1, 2, 3].forEach((testNum) => {
    e2e.it(`displays correct UI for errors (${testNum})`, {
      spec: `various_failures_spec_${testNum}.js`,
      expectedExitCode: null,
      noTypeScript: true,
      onRun (exec) {
        return exec().then(verifyPassesAndFailures)
      },
    })

    e2e.it(`displays correct UI for errors in custom commands (${testNum})`, {
      spec: `various_failures_custom_commands_spec_${testNum}.js`,
      expectedExitCode: null,
      noTypeScript: true,
      onRun (exec) {
        return exec().then(verifyPassesAndFailures)
      },
    })
  })

  e2e.it('displays correct UI for typescript errors', {
    spec: 'various_failures_spec.ts',
    expectedExitCode: null,
    onRun (exec) {
      return exec().then(verifyPassesAndFailures)
    },
  })

  const WEBPACK_PREPROCESSOR_PROJECTS = [
    'webpack-preprocessor',
    'webpack-preprocessor-ts-loader',
    'webpack-preprocessor-ts-loader-compiler-options',
    'webpack-preprocessor-awesome-typescript-loader',
  ]

  WEBPACK_PREPROCESSOR_PROJECTS.forEach((project) => {
    e2e.it(`handles sourcemaps in webpack for project: ${project}`, {
      project: Fixtures.projectPath(project),
      spec: 'failing_spec.*',
      expectedExitCode: null,
      onRun (exec) {
        return exec().then(verifyPassesAndFailures)
      },
    })
  })
})
