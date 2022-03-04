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

  // NOTE: This can be used to demonstrate the Firefox out-of-memory issue, but it is skipped
  // because it takes forever and is redundant since we test `services` against Cypress prereleases.
  // @see https://github.com/cypress-io/cypress/issues/6187
  systemTests.it.skip('can run a lot of tests', {
    outputPath,
    project: 'firefox-memory',
    spec: 'spec.js',
    browser: 'firefox',
    expectedExitCode: 0,
    timeout: 1e9,
    config: {
      video: false,
    },
    onRun: (exec) => {
      return exec()
      .then(() => {
        return Bluebird.resolve(fs.readJson(outputPath))
        .get('runs')
        .get(0)
        .get('tests')
        .map((test: any, i) => {
          return {
            num: i + 1,
            ...test.timings,
          }
        })
        .then((tests) => {
          // eslint-disable-next-line
          console.log(util.inspect(tests, {
            depth: Infinity,
            breakLength: Infinity,
            maxArrayLength: Infinity,
          }))
        })
      })
    },
    // snapshot: true,
  })

  systemTests.it('launches maximized by default', {
    browser: 'firefox',
    project: 'screen-size',
    spec: 'maximized.spec.js',
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
    spec: 'simple_spec.js,simple_passing_spec.js',
  })
})
