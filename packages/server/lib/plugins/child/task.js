const _ = require('lodash')
const util = require('../util')
const errors = require('../../errors')

const getBody = (ipc, events, ids, [event]) => {
  const taskEvent = _.find(events, { event: 'task' }).handler
  const invoke = () => {
    const fn = taskEvent[event]

    return _.isFunction(fn) ? fn.toString() : ''
  }

  util.wrapChildPromise(ipc, invoke, ids)
}

const getKeys = (ipc, events, ids) => {
  const taskEvent = _.find(events, { event: 'task' }).handler
  const invoke = () => _.keys(taskEvent)

  util.wrapChildPromise(ipc, invoke, ids)
}

const merge = (prevEvents, events) => {
  const duplicates = _.intersection(_.keys(prevEvents), _.keys(events))

  if (duplicates.length) {
    errors.warning('DUPLICATE_TASK_KEY', duplicates.join(', '))
  }

  return _.extend(prevEvents, events)
}

const wrap = (ipc, events, ids, args) => {
  const task = args[0]
  let arg = args[1]

  // ipc converts undefined to null.
  // we're restoring it.
  if (arg && arg.__cypress_task_no_argument__) {
    arg = undefined
  }

  const invoke = (eventId, args = []) => {
    const handler = _.get(events, `${eventId}.handler.${task}`)

    if (_.isFunction(handler)) {
      return handler(...args)
    }

    return '__cypress_unhandled__'
  }

  util.wrapChildPromise(ipc, invoke, ids, [arg])
}

module.exports = {
  getBody,
  getKeys,
  merge,
  wrap,
}
