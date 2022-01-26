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
    this.honey = new Libhoney({
      dataset: 'systemtest-performance',
      writeKey: process.env.HONEYCOMB_API_KEY,
    })

    runner.on('test', (test) => {
      test.wallclockStart = Date.now()
    })

    runner.on('test end', (test, done) => {
      // Skipped tests never get a 'start' event, but they still get 'test end' somehow.
      if (test.state === 'skipped') {
        return
      }

      commitInfo().then((commitInformation) => {
        const ciInformation = ciProvider.commitParams() || {}
        const [, testTitle, browser] = test.title.match(/(.+?)(?: \[([a-z]+)\])?$/)

        const honeycombEvent = this.honey.newEvent()

        honeycombEvent.timestamp = test.wallclockStart
        honeycombEvent.add({
          test: testTitle,
          specFile: path.basename(test.file),
          browser,
          state: test.state,
          durationMs: Date.now() - test.wallclockStart,
          mochaDurationMs: test.duration,
          branch: commitInformation.branch || ciInformation.branch,
          commitSha: commitInformation.sha || ciInformation.sha,
          buildUrl: process.env.CIRCLE_BUILD_URL,
          platform: process.platform,
          arch: process.arch,
          version: pkg.version,
        })

        honeycombEvent.send()
      })
    })
  }

  // If there is no done callback, then mocha-multi-reporter will kill the process without waiting for our honeycomb post to complete.
  done (failures, callback) {
    this.honey.flush().then(callback)
  }
}

module.exports = StatsdReporter
