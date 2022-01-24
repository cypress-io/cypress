const path = require('path')
const mochaReporters = require('mocha-7.0.1/lib/reporters')
const Libhoney = require('libhoney')
const pkg = require('@packages/root')

const ciProvider = require('@packages/server/lib/util/ci_provider')
const { commitInfo } = require('@cypress/commit-info')

class StatsdReporter extends mochaReporters.Spec {
  constructor (runner) {
    super(runner)
    if (process.env.CIRCLECI) {
      console.log('Reporting results to honeycomb')

      this.hny = new Libhoney({
        writeKey: '531a9eae0fcdde85b2ebccbe2b79e83c',
        dataset: 'systemtest-performance',
      })

      runner.on('test', (test) => {
        test.honeycombEvent = this.hny.newEvent()
        test.honeycombEvent.timestamp = Date.now()

        commitInfo().then((commitInformation) => {
          const ciInformation = ciProvider.commitParams() || {}

          test.honeycombEvent.add({
            specFile: path.basename(test.file),
            test: test.title,
            branch: commitInformation.branch || ciInformation.branch,
            commitSha: commitInformation.sha || ciInformation.sha,
            buildUrl: process.env.CIRCLE_BUILD_URL,
            platform: process.platform,
            arch: process.arch,
            version: pkg.version,
          })
        })
      })

      runner.on('test end', (test, done) => {
        // Skipped tests never get a 'start' event, but they still get 'test end' somehow.
        if (test.honeycombEvent) {
          test.honeycombEvent.add({
            // This is slightly longer than mocha's reported time
            durationMs: Date.now() - test.honeycombEvent.timestamp,
            mochaDurationMs: test.duration,
            state: test.state,
          })

          test.honeycombEvent.send()
        }
      })

      runner.on('end', () => {
        console.log('ending!')
      })
    }
  }

  done (failures, callback) {
    this.hny.flush().then(callback)
  }
}

module.exports = StatsdReporter
