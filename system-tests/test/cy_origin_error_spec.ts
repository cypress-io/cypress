import path from 'path'
import systemTests, { expect } from '../lib/system-tests'
import Fixtures from '../lib/fixtures'

const e2ePath = Fixtures.projectPath('e2e')

const PORT = 3500
const onServer = function (app) {
  app.get('/secondary_origin.html', (_, res) => {
    res.sendFile(path.join(e2ePath, 'secondary_origin.html'))
  })
}
const commonConfig = {
  hosts: {
    '*.foobar.com': '127.0.0.1',
  },
  e2e: {
    experimentalOriginDependencies: true,
  },
}

// TODO: This is probably more appropriate for a cy-in-cy test
// https://github.com/cypress-io/cypress/issues/20973
describe('e2e cy.origin errors', () => {
  systemTests.setup({
    servers: [{
      port: 4466,
      onServer,
    }],
  })

  systemTests.it('captures the stack trace correctly for errors in cross origins to point users to their "cy.origin" callback', {
    browser: '!webkit', // TODO(webkit): fix+unskip (needs multidomain support)
    // keep the port the same to prevent issues with the snapshot
    port: PORT,
    spec: 'cy_origin_error.cy.ts',
    expectedExitCode: 2,
    config: commonConfig,
    async onRun (exec) {
      const { stdout } = await exec()

      expect(stdout).to.contain('AssertionError')
      expect(stdout).to.contain('Timed out retrying after 1ms: Expected to find element: `#doesnotexist`, but never found it.')

      // check to make sure stack trace contains the 'cy.origin' source
      expect(stdout).to.contain('webpack:///./cypress/e2e/cy_origin_error.cy.ts:16:7')
      expect(stdout).to.contain('webpack:///./cypress/e2e/cy_origin_error.cy.ts:32:7')
    },
  })

  systemTests.it('errors when not using webpack-preprocessor', {
    browser: '!webkit', // TODO(webkit): results in "TypeError: expecting an array or an iterable object but got [object Null]"
    project: 'passthru-preprocessor',
    spec: 'cross_origin.cy.js',
    expectedExitCode: 1,
    config: commonConfig,
    async onRun (exec) {
      const res = await exec()

      expect(res.stdout).to.contain('Using `require()` or `import()` to include dependencies requires enabling the `experimentalOriginDependencies` flag and using the latest version of `@cypress/webpack-preprocessor`')
    },
  })

  systemTests.it('errors when the experimentalOriginDependencies flag is not set', {
    browser: '!webkit', // TODO(webkit): results in "TypeError: expecting an array or an iterable object but got [object Null]"
    spec: 'cy_origin_experimental_dependencies_error.cy.ts',
    expectedExitCode: 1,
    config: { ...commonConfig, e2e: { experimentalOriginDependencies: false } },
    async onRun (exec) {
      const res = await exec()

      expect(res.stdout).to.contain('Using `require()` or `import()` to include dependencies requires enabling the `experimentalOriginDependencies` flag and using the latest version of `@cypress/webpack-preprocessor`')
    },
  })

  systemTests.it('errors when using a plugin that has a custom command that uses cy.origin with a dependency', {
    browser: '!webkit', // TODO(webkit): cy.origin is not currently supported in webkit
    project: 'origin-dependencies',
    spec: 'cross_origin.cy.js',
    expectedExitCode: 1,
    config: commonConfig,
    async onRun (exec) {
      const res = await exec()

      expect(res.stdout).to.contain('Using `require()` or `import()` to include dependencies requires enabling the `experimentalOriginDependencies` flag and using the latest version of `@cypress/webpack-preprocessor`')
      expect(res.stdout).to.contain('Note: Using `require()` or `import()` within `cy.origin()` from a `node_modules` plugin is not currently supported.')
    },
  })
})
