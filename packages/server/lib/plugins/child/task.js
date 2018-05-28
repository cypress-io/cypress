const _ = require('lodash')
const util = require('../util')

const getBody = (ipc, events, ids, [event]) => {
  const taskEvent = _.find(events, { event: 'task' }).handler
  const invoke = () => taskEvent[event].toString()

  util.wrapChildPromise(ipc, invoke, ids)
}

const getKeys = (ipc, events, ids) => {
  const taskEvent = _.find(events, { event: 'task' }).handler
  const invoke = () => _.keys(taskEvent)

  util.wrapChildPromise(ipc, invoke, ids)
}

const wrap = (ipc, events, ids, args) => {
  const task = args[0]
  const arg = args[1]

  const invoke = (eventId, args = []) => {
    const handler = _.get(events, `${eventId}.handler.${task}`)
    if (_.isFunction(handler)) {
      return handler(...args)
    } else {
      return '__cypress_unhandled__'
    }
  }

  util.wrapChildPromise(ipc, invoke, ids, [arg])
}

module.exports = {
  getBody,
  getKeys,
  wrap,
}
