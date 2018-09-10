/* eslint-disable no-console */
const Promise = require('bluebird')

module.exports = (on) => {
  on('before:run', (runDetails) => {
    console.log('before:run', runDetails.specs[0].relative)
    return Promise.delay(10).then(() => console.log('before:run is awaited'))
  })

  on('before:spec', (spec) => {
    console.log('before:spec:', spec.relative)
    return Promise.delay(10).then(() => console.log('before:spec is awaited'))
  })

  on('after:spec', (spec, results) => {
    const { stats } = results
    const { tests, passes, failures } = stats
    console.log('after:spec:', spec.relative, { tests, passes, failures })
    return Promise.delay(10).then(() => console.log('after:spec is awaited'))
  })

  on('after:run', (results) => {
    const { totalTests, totalPassed, totalFailed } = results
    console.log('after:run:', { totalTests, totalPassed, totalFailed })
    return Promise.delay(10).then(() => console.log('after:run is awaited'))
  })
}
