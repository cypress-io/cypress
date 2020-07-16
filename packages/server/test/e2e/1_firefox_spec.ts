import path from 'path'
import util from 'util'
import fs from 'fs-extra'

import e2e, { expect } from '../support/helpers/e2e'
import Bluebird from 'bluebird'
import Fixtures from '../support/helpers/fixtures'

const e2ePath = Fixtures.projectPath('e2e')
const outputPath = path.join(e2ePath, 'output.json')

describe('e2e firefox', function () {
  e2e.setup()

  // NOTE: This can be used to demonstrate the Firefox out-of-memory issue, but it is skipped
  // because it takes forever and is redundant since we test `services` against Cypress prereleases.
  // @see https://github.com/cypress-io/cypress/issues/6187
  e2e.it.skip('can run a lot of tests', {
    outputPath,
    project: Fixtures.projectPath('firefox-memory'),
    spec: 'spec.js',
    browser: 'firefox',
    expectedExitCode: 0,
    timeout: 1e9,
    config: {
      video: false,
    },
    exit: false,
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

  e2e.it('launches maximized by default', {
    browser: 'firefox',
    project: Fixtures.projectPath('screen-size'),
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
  e2e.it.skip('can run multiple specs', {
    browser: 'firefox',
    project: Fixtures.projectPath('e2e'),
    spec: 'simple_spec.coffee,simple_passing_spec.coffee',
  })
})
