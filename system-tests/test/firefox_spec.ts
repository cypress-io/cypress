import path from 'path'
import util from 'util'
import fs from 'fs-extra'

import systemTests, { expect } from '../lib/system-tests'
import Bluebird from 'bluebird'
import Fixtures from '../lib/fixtures'

const e2ePath = Fixtures.projectPath('e2e')
const outputPath = path.join(e2ePath, 'output.json')

describe('e2e firefox', function () {
  systemTests.setup()

  systemTests.it('launches maximized by default', {
    browser: 'firefox',
    project: 'screen-size',
    spec: 'maximized.cy.js',
    onRun: async (exec) => {
      const { stderr } = await exec({
        processEnv: {
          // trigger foxdriver's built-in debug logs
          DEBUG: process.env.DEBUG || 'foo',
        },
      })

      // @see https://github.com/cypress-io/cypress/issues/7723
      expect(stderr).not.to.include('foxdriver')
    },
  })

  // NOTE: only an issue on windows
  // https://github.com/cypress-io/cypress/issues/6392
  systemTests.it.skip('can run multiple specs', {
    browser: 'firefox',
    project: 'e2e',
    spec: 'simple.cy.js,simple_passing.cy.js',
  })
})
