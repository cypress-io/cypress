const errors = require('../errors')
const plugins = require('../plugins')

module.exports = {
  execute: async (eventName, config = {}, ...args) => {
    if (!plugins.has(eventName)) return

    return await plugins.execute(eventName, ...args)
    .catch((err) => {
      err = err || {}

      errors.throwErr('PLUGINS_RUN_EVENT_ERROR', eventName, err)
    })
  },
}
