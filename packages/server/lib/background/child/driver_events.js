const _ = require('lodash')
const util = require('../util')

module.exports = {
  execute (ipc, events, ids, args) {
    const eventName = args[0]

    args = args.slice(1)
    const event = _.find(events, { event: eventName })

    const invoke = () => {
      if (event && _.isFunction(event.handler)) {
        event.handler(...args)
      }
    }

    util.wrapChildPromise(ipc, invoke, ids, args)
  },
}
