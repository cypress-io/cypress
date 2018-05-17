const Promise = require('bluebird')

module.exports = (on) => {
  on('task', {
    'return:arg' (arg) {
      return arg
    },
    'wait' () {
      return Promise.delay(2000)
    },
  })
}
