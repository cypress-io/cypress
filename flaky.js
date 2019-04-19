/* eslint-disable no-console */

const Promise = require('bluebird')
const humanInterval = require('human-interval')
const cypress = require('./cli')

const oneHour = humanInterval('1 hour')
const threeMinutes = humanInterval('3 minutes')

const run = () => {
  return cypress.run({
    project: '/tmp/repo',
    dev: true,
    config: {
      video: false,
    },
  })
  .timeout(threeMinutes)
  .then((res) => {
    if (res.totalFailed === 0) {
      return run()
    }

    return res
  })
}

// run for a maximum of 1 hour
// and then stop
run()
.timeout(oneHour)
.then(console.log)
.catch(Promise.TimeoutError, (err) => {
  console.log('exiting due to timeout', err.message)

  process.exit(1)
})
