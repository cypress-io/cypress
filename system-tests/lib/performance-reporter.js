const path = require('path')
const pkg = require('@packages/root')
const rp = require('@cypress/request-promise')

const ciProvider = require('@packages/server/lib/util/ci_provider')
const { commitInfo } = require('@cypress/commit-info')

const dataset = 'systemtest-performance'
const writeKey = '531a9eae0fcdde85b2ebccbe2b79e83c'

class StatsdReporter {
  constructor (runner) {
    if (!process.env.CIRCLECI) {
      return
    }

    console.log('Reporting to honeycomb')

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

        const body = [{
          time: new Date(),
          samplerate: 1,
          data: {
            durationMs: Date.now() - test.wallclockStart,
            mochaDurationMs: test.duration,
            state: test.state,
            specFile: path.basename(test.file),
            test: testTitle,
            browser,
            branch: commitInformation.branch || ciInformation.branch,
            commitSha: commitInformation.sha || ciInformation.sha,
            buildUrl: process.env.CIRCLE_BUILD_URL,
            platform: process.platform,
            arch: process.arch,
            version: pkg.version,
          },
        }]

        rp.post({
          url: `https://api.honeycomb.io/1/batch/${dataset}`,
          json: true,
          headers: { 'X-Honeycomb-Team': writeKey },
          body,
          timeout: 5000,
        })
      })
    })
  }

  // If there is no done callback, then mocha-multi-reporter will kill the process without waiting for our honeycomb post to complete.
  done (failures, callback) {}
}

module.exports = StatsdReporter
