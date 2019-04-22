const Promise = require('bluebird')

Promise.config({
  cancellation: true,
  longStackTraces: true,
  monitoring: true,
  warnings: {
    wForgottenReturn: true,
  },
})

module.exports = Promise
