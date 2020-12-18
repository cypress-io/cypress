/* eslint-disable no-console */
const Promise = require('bluebird')

module.exports = (on) => {
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
