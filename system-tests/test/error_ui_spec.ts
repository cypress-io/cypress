import systemTests, { expect } from '../lib/system-tests'
import Fixtures from '../lib/fixtures'
import path from 'path'

const verifyPassedAndFailedAreSame = (expectedFailures) => {
  return ({ stdout }) => {
    const passes = stdout.match(/✓ ✓ VERIFY/g)

    expect(passes?.length || 0, 'number of passes should equal the number of failures').to.equal(expectedFailures)
  }
}

describe('e2e error ui', function () {
  systemTests.setup()

  ;[
    'webpack-preprocessor',
    'webpack-preprocessor-ts-loader',
    'webpack-preprocessor-ts-loader-compiler-options',
    // TODO: unskip this once we understand why it is failing
    // @see https://github.com/cypress-io/cypress/issues/18497
    // 'webpack-preprocessor-awesome-typescript-loader',
  ]
  .forEach((project) => {
    systemTests.it(`handles sourcemaps in webpack for project: ${project}`, {
      project: Fixtures.projectPath(project),
      spec: 'failing_spec.*',
      expectedExitCode: 1,
      onRun (exec) {
        return exec().then(verifyPassedAndFailedAreSame(1))
      },
    })
  })

  // https://github.com/cypress-io/cypress/issues/16255
  systemTests.it('handles errors when integration folder is outside of project root', {
    project: path.join(Fixtures.projectPath('integration-outside-project-root'), 'project-root'),
    spec: '../../../integration/failing_spec.js',
    expectedExitCode: 1,
    onRun (exec) {
      return exec().then(verifyPassedAndFailedAreSame(1))
    },
  })
})
