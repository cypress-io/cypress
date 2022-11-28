const path = require('path')
const chalk = require('chalk')
const Libhoney = require('libhoney')
const { v4: uuidv4 } = require('uuid')

const ciProvider = require('@packages/server/lib/util/ci_provider')
const { commitInfo } = require('@cypress/commit-info')
const { getNextVersionForPath } = require('../../scripts/get-next-version')

const honey = new Libhoney({
  dataset: 'systemtest-performance',
  writeKey: process.env.HONEYCOMB_API_KEY,
})

// This event is created here independently every time the reporter
// is imported (in each parallel instance of the system-tests
// in circleci) so that we can use it as the parent,
// but ../scripts/send-root-honeycomb-event.js
// is only invoked once at the start of the build,
// and is responsible for sending it to honeycomb.
const spanId = process.env.CIRCLE_WORKFLOW_ID || uuidv4()
const circleCiRootEvent = honey.newEvent()

circleCiRootEvent.timestamp = Date.now()
circleCiRootEvent.add({
  buildUrl: process.env.CIRCLE_BUILD_URL,
  platform: process.platform,
  arch: process.arch,
  name: 'ci_run',

  spanId,
  traceId: spanId,
})

// Mocha events ('test', 'test end', etc) have no way to wait
// for async callbacks, so we can't guarantee we have this
// data ready by the time any of the reporter's events are emitted.

// Therefore, we have each honeycomb event await this promise
// before sending itself.
let asyncInfo = Promise.all([getNextVersionForPath(path.resolve(__dirname, '../../packages')), commitInfo()])
.then(([nextVersion, commitInformation]) => {
  const ciInformation = ciProvider.commitParams() || {}

  return {
    nextVersion,
    branch: commitInformation.branch || ciInformation.branch,
    commitSha: commitInformation.sha || ciInformation.sha,
  }
})

function addAsyncInfoAndSend (honeycombEvent) {
  return asyncInfo.then((info) => {
    honeycombEvent.add(info)
    honeycombEvent.send()
  })
}

class HoneycombReporter {
  constructor (runner) {
    if (!process.env.HONEYCOMB_API_KEY) {
      return
    }

    console.log(chalk.green('Reporting to honeycomb'))

    runner.on('suite', (suite) => {
      if (!suite.title) {
        return
      }

      const parent = suite.parent && suite.parent.honeycombEvent ? suite.parent.honeycombEvent : circleCiRootEvent

      suite.honeycombEvent = honey.newEvent()
      suite.honeycombEvent.timestamp = Date.now()
      suite.honeycombEvent.add({
        ...parent.data,
        suite: suite.title,
        specFile: suite.file && path.basename(suite.file),
        name: 'spec_execution',

        spanId: uuidv4(),
        parentId: parent.data.spanId,
      })
    })

    runner.on('test', (test) => {
      const path = test.titlePath()
      // This regex pulls apart a string like `failing1 [electron]`
      // into `failing1` and `electron`, letting us use the same
      // test name for all browsers, with the browser as a separate field.
      // The browser capture group is optional because some tests aren't browser specific,
      // in which case it will be undefined and not passed as a field to honeycomb.
      const [, testTitle, browser] = path[path.length - 1].match(/(.+?)(?: \[([a-z]+)\])?$/)

      test.honeycombEvent = honey.newEvent()
      test.honeycombEvent.timestamp = Date.now()
      test.honeycombEvent.add({
        ...test.parent.honeycombEvent.data,
        test: testTitle,
        browser,
        name: 'test_execution',

        spanId: uuidv4(),
        parentId: test.parent.honeycombEvent.data.spanId,
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

      addAsyncInfoAndSend(test.honeycombEvent)
    })

    runner.on('suite end', (suite) => {
      if (!suite.honeycombEvent) {
        return
      }

      suite.honeycombEvent.add({
        durationMs: Date.now() - suite.honeycombEvent.timestamp,
      })

      addAsyncInfoAndSend(suite.honeycombEvent)
    })
  }

  // If there is no done method, then mocha-multi-reporter will kill the process
  // without waiting for our honeycomb posts to complete.
  done (failures, callback) {
    // Await the asyncInfo promise one last time, to ensure all events have
    // added the data and sent themselves before we flush honeycomb's queue and exit.
    asyncInfo
    .then(() => honey.flush())
    .then(callback)
  }
}

module.exports = HoneycombReporter

HoneycombReporter.honey = honey
HoneycombReporter.circleCiRootEvent = circleCiRootEvent
HoneycombReporter.addAsyncInfoAndSend = addAsyncInfoAndSend
