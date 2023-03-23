const Promise = require('bluebird')

const errors = require('../errors')
const plugins = require('../plugins')

module.exports = {
  execute: Promise.method((eventName, ...args) => {
    if (!plugins.has(eventName)) return

    return plugins.execute(eventName, ...args)
    .catch((err) => {
      err = err || {}

      errors.throwErr('PLUGINS_RUN_EVENT_ERROR', eventName, err)
    })
  }),
}
