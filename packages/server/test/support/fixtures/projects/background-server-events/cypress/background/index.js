/* eslint-disable no-console */
const Promise = require('bluebird')

module.exports = (on) => {
  on('run:start', (runDetails) => {
    console.log('run:start', runDetails.specs[0].relative)

    return Promise.delay(10).then(() => {
      return console.log('run:start is awaited')
    })
  })

  on('spec:start', (spec) => {
    console.log('spec:start:', spec.relative)

    return Promise.delay(10).then(() => {
      return console.log('spec:start is awaited')
    })
  })

  on('spec:end', (spec, results) => {
    const { stats } = results
    const { tests, passes, failures } = stats

    console.log('spec:end:', spec.relative, { tests, passes, failures })

    return Promise.delay(10).then(() => {
      return console.log('spec:end is awaited')
    })
  })

  on('run:end', (results) => {
    const { totalTests, totalPassed, totalFailed } = results

    console.log('run:end:', { totalTests, totalPassed, totalFailed })

    return Promise.delay(10).then(() => {
      return console.log('run:end is awaited')
    })
  })
}
