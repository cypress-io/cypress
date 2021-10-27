/* eslint-disable no-console */
const Promise = require('bluebird')

module.exports = (on) => {
  on('before:run', (runDetails) => {
    const { specs, browser } = runDetails

    console.log('before:run:', specs[0].relative, browser.name)

    return Promise.delay(10).then(() => {
      return console.log('before:run is awaited')
    })
  })

  on('after:run', (results) => {
    const { totalTests, totalPassed, totalFailed } = results

    console.log('after:run:', { totalTests, totalPassed, totalFailed })

    return Promise.delay(10).then(() => {
      return console.log('after:run is awaited')
    })
  })

  on('before:spec', (spec) => {
    console.log('before:spec:', spec.relative)

    return Promise.delay(10).then(() => {
      return console.log('before:spec is awaited')
    })
  })

  on('after:spec', (spec, results) => {
    const { stats } = results
    const { tests, passes, failures } = stats

    console.log('spec:end:', spec.relative, { tests, passes, failures })

    return Promise.delay(10).then(() => {
      return console.log('after:spec is awaited')
    })
  })
}
