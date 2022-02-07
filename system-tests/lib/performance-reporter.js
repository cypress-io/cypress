const path = require('path')
const chalk = require('chalk')
const Libhoney = require('libhoney')
const { v4: uuidv4 } = require('uuid')

const ciProvider = require('@packages/server/lib/util/ci_provider')
const { commitInfo } = require('@cypress/commit-info')
const { getNextVersionForPath } = require('../../scripts/get-next-version')

class HoneycombReporter {
  constructor (runner) {
    if (!process.env.HONEYCOMB_API_KEY) {
      return
    }

    console.log(chalk.green('Reporting to honeycomb'))
    this.honey = new Libhoney({
      dataset: 'systemtest-performance',
      writeKey: process.env.HONEYCOMB_API_KEY,
    })

    runner.on('suite', (suite) => {
      if (suite.root) {
        suite.honeycombEvent = this.rootEvent()

        return
      }

      suite.honeycombEvent = this.honey.newEvent()
      suite.honeycombEvent.timestamp = Date.now()
      suite.honeycombEvent.add({
        suite: suite.title,
        specFile: path.basename(suite.file),

        spanId: uuidv4(),
        parentId: suite.parent.honeycombEvent.data.spanId,
        traceId: suite.parent.honeycombEvent.data.traceId,
      })
    })

    runner.on('test', (test) => {
      const title = test.titlePath().join(' / ')
      // This regex pulls apart a string like `e2e async timeouts / failing1 [electron]`
      // into `e2e async timeouts / failing1` and `electron`, letting us use the same
      // test name for all browsers, with the browser as a separate field.
      // The browser capture group is optional because some tests aren't browser specific,
      // in which case it will be undefined and not passed as a field to honeycomb.
      const [, testTitle, browser] = title.match(/(.+?)(?: \[([a-z]+)\])?$/)

      test.honeycombEvent = this.honey.newEvent()
      test.honeycombEvent.timestamp = Date.now()
      test.honeycombEvent.add({
        test: testTitle,
        browser,

        spanId: uuidv4(),
        parentId: test.parent.honeycombEvent.data.spanId,
        traceId: test.parent.honeycombEvent.data.traceId,
      })
    })

    runner.on('test end', (test) => {
      // Skipped tests never get a 'start' event, but they still get 'test end' somehow.
      if (!test.state || test.state === 'skipped') {
        return
      }

      test.honeycombEvent.add({
        state: test.state,
        err: test.err && test.err.message,
        errStack: test.err && test.err.stack,
        durationMs: Date.now() - test.honeycombEvent.timestamp,
      })

      test.honeycombEvent.send()
    })

    runner.on('suite end', (suite) => {
      suite.honeycombEvent.add({
        durationMs: Date.now() - suite.honeycombEvent.timestamp,
      })

      suite.honeycombEvent.send()
    })
  }

  // If there is no done callback, then mocha-multi-reporter will kill the process without waiting for our honeycomb post to complete.
  done (failures, callback) {
    if (this.honey) {
      this.honey.flush().then(callback)
    }
  }

  rootEvent () {
    const honeycombEvent = this.honey.newEvent()

    honeycombEvent.timestamp = Date.now()
    honeycombEvent.add({
      buildUrl: process.env.CIRCLE_BUILD_URL,
      platform: process.platform,
      arch: process.arch,

      spanId: uuidv4(),
      traceId: uuidv4(),
    })

    commitInfo().then((commitInformation) => {
      const ciInformation = ciProvider.commitParams() || {}

      honeycombEvent.add({
        branch: commitInformation.branch || ciInformation.branch,
        commitSha: commitInformation.sha || ciInformation.sha,
      })
    })

    getNextVersionForPath('../../packages').then((next) => {
      honeycombEvent.add({ nextVersion: next })
    })

    return honeycombEvent
  }
}

module.exports = HoneycombReporter
