/* eslint-disable no-console */
const Promise = require('bluebird')

module.exports = (on) => {
  on('before:spec', (spec) => {
    console.log('before:spec:', spec.relative)

    return Promise.delay(10).then(() => {
      return console.log('before:spec is awaited')
    })
  })
}
