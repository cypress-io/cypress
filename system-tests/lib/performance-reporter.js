const path = require('path')
const chalk = require('chalk')
const Libhoney = require('libhoney')

const pkg = require('@packages/root')
const ciProvider = require('@packages/server/lib/util/ci_provider')
const { commitInfo } = require('@cypress/commit-info')

class StatsdReporter {
  constructor (runner) {
    if (!process.env.HONEYCOMB_API_KEY) {
      return
    }

    console.log(chalk.green('Reporting to honeycomb'))

    let branch
    let commitSha

    this.honey = new Libhoney({
      dataset: 'systemtest-performance',
      writeKey: process.env.HONEYCOMB_API_KEY,
    })

    commitInfo().then((commitInformation) => {
      const ciInformation = ciProvider.commitParams() || {}

      branch = commitInformation.branch || ciInformation.branch
      commitSha = commitInformation.sha || ciInformation.sha
    })

    runner.on('test', (test) => {
      test.wallclockStart = Date.now()
    })

    runner.on('test end', (test) => {
      // Skipped tests never get a 'start' event, but they still get 'test end' somehow.
      if (!test.state || test.state === 'skipped') {
        return
      }

      const title = test.titlePath().join(' / ')
      // This regex pulls apart a string like `e2e async timeouts / failing1 [electron]`
      // into `e2e async timeouts / failing1` and `electron`, letting us use the same
      // test name for all browsers, with the browser as a separate field.
      // The browser capture group is optional because some tests aren't browser specific,
      // in which case it will be undefined and not passed as a field to honeycomb.
      const [, testTitle, browser] = title.match(/(.+?)(?: \[([a-z]+)\])?$/)

      const honeycombEvent = this.honey.newEvent()

      honeycombEvent.timestamp = test.wallclockStart
      honeycombEvent.add({
        test: testTitle,
        specFile: path.basename(test.file),
        browser,
        state: test.state,
        err: test.err && test.err.message,
        errStack: test.err && test.err.stack,
        durationMs: Date.now() - test.wallclockStart,
        mochaDurationMs: test.duration,
        branch,
        commitSha,
        buildUrl: process.env.CIRCLE_BUILD_URL,
        platform: process.platform,
        arch: process.arch,
        version: pkg.version,
      })

      honeycombEvent.send()
    })
  }

  // If there is no done callback, then mocha-multi-reporter will kill the process without waiting for our honeycomb post to complete.
  done (failures, callback) {
    if (this.honey) {
      this.honey.flush().then(callback)
    }
  }
}

module.exports = StatsdReporter
