import systemTests from '../lib/system-tests'
import Fixtures from '../lib/fixtures'
import path from 'path'
import globby from 'globby'
import { escapeRegExp } from 'lodash'

describe('@cypress/webpack-dev-server', function () {
  systemTests.setup()

  const wdsPath = Fixtures.projectPath('webpack-dev-server')

  systemTests.it('successfully loads and runs all specs', {
    project: 'webpack-dev-server',
    testingType: 'component',
    spec: 'src/**/*',
    browser: 'chrome',
    expectedExitCode: 0,
    onRun: async (exec) => {
      // We do not expect any failures in this suite, but we need to check that we actually ran
      // the tests that we expected to run to validate that WDS is properly parsing & loading
      // tests with special filepaths

      const { stdout } = await exec()

      // Find all specs that should have been run as part of this system test
      // by scanning filesystem using spec pattern
      const files = await globby(path.join(wdsPath, 'src', '**', '*'))

      // sanity check that we actually found some spec files
      expect(files).to.have.length.greaterThan(0)

      files.forEach((fileName) => {
        // Parse out the subpath under 'src' that we expect to appear in the output results table
        const expectedFileName = fileName
        .replace(path.join(wdsPath, 'src'), '')
        .replace(/^\/|\\/, '') // Remove leading path separator if one exists

        // Pattern to match final output table entry
        // Should include checkmark, filename, # of tests (1), and # of passes (1)
        //    ✔  [...bar].cy.js                            17ms        1        1
        const expectedPattern = new RegExp(`✔\\s+${escapeRegExp(expectedFileName)}\\s+\\d+ms\\s+1\\s+1`)

        expect(stdout).to.match(expectedPattern)
      })
    },
  })

  systemTests.it('successfully loads and runs all specs with typescript config', {
    project: 'webpack-dev-server-ts',
    testingType: 'component',
    spec: 'test.cy.ts',
    browser: 'chrome',
    expectedExitCode: 0,
  })
})
