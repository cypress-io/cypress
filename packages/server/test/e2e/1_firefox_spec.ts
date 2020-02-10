const path = require('path')
const util = require('util')

const fs = require('../../lib/util/fs')
const e2e = require('../support/helpers/e2e')
const Fixtures = require('../support/helpers/fixtures')

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
        return fs.readJsonAsync(outputPath)
        .get('runs')
        .get(0)
        .get('tests')
        .map((test, i) => {
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
    spec: '*',
  })
})
