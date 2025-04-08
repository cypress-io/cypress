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

  beforeEach(async () => {
    await Fixtures.scaffoldProject('e2e')
  })

  ;[
    'webpack-preprocessor',
    'webpack-preprocessor-ts-loader',
    'webpack-preprocessor-ts-loader-compiler-options',
  ]
  .forEach((project) => {
    systemTests.it(`handles sourcemaps in webpack for project: ${project}`, {
      browser: '!webkit', // TODO(webkit): fix+unskip
      project,
      spec: 'failing.*',
      expectedExitCode: 1,
      onRun (exec) {
        return exec().then(verifyPassedAndFailedAreSame(1))
      },
    })
  })

  // https://github.com/cypress-io/cypress/issues/16255
  systemTests.it('handles errors when test files are outside of project root', {
    browser: '!webkit', // TODO(webkit): fix+unskip
    project: 'integration-outside-project-root/project-root',
    spec: '../../../e2e/failing.cy.js',
    expectedExitCode: 1,
    onRun: async (exec) => {
      await Fixtures.scaffoldProject('integration-outside-project-root')

      return exec().then(verifyPassedAndFailedAreSame(1))
    },
  })
})
