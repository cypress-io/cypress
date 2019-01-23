const _ = require('lodash')
const util = require('../util')

module.exports = {
  wrap (ipc, events, ids, args) {
    const eventName = args[0]

    args = args.slice(1)
    const event = _.find(events, { event: eventName })

    const invoke = () => {
      const handler = _.get(event, 'handler')

      if (_.isFunction(handler)) {
        return handler(...args)
      }
    }

    util.wrapChildPromise(ipc, invoke, ids, args)
  },
}
