import systemTests, { expect } from '../lib/system-tests'
import Fixtures from '../lib/fixtures'

const verifyPassedAndFailedAreSame = (expectedFailures) => {
  return ({ stdout }) => {
    const passes = stdout.match(/✓ ✓ VERIFY/g)

    expect(passes?.length || 0, 'number of passes should equal the number of failures').to.equal(expectedFailures)
  }
}

describe('e2e error ui', function () {
  systemTests.setup()

  beforeEach(() => {
    Fixtures.scaffoldProject('e2e')
  })

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
      project,
      spec: 'failing.*',
      expectedExitCode: 1,
      onRun (exec) {
        return exec().then(verifyPassedAndFailedAreSame(1))
      },
    })
  })

  // https://github.com/cypress-io/cypress/issues/16255
  systemTests.it('handles errors when integration folder is outside of project root', {
    project: 'integration-outside-project-root/project-root',
    spec: '../../../e2e/failing.cy.js',
    expectedExitCode: 1,
    onRun (exec) {
      Fixtures.scaffoldProject('integration-outside-project-root')

      return exec().then(verifyPassedAndFailedAreSame(1))
    },
  })
})
