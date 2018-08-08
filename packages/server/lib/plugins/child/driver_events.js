const _ = require('lodash')

module.exports = {
  execute (events, args) {
    const eventName = args[0]
    args = args.slice(1)
    const event = _.find(events, { event: eventName })

    if (event && _.isFunction(event.handler)) {
      event.handler(...args)
    }
  },
}
