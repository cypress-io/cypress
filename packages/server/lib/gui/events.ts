/* eslint-disable no-case-declarations */
const _ = require('lodash')
const ipc = require('electron').ipcMain
const debug = require('debug')('cypress:server:events')

import type { LaunchArgs } from '@packages/types'
import type { EventEmitter } from 'events'

const nullifyUnserializableValues = (obj) => {
  // nullify values that cannot be cloned
  // https://github.com/cypress-io/cypress/issues/6750
  return _.cloneDeepWith(obj, (val) => {
    if (_.isFunction(val)) {
      return null
    }

    return undefined
  })
}

const handleEvent = function (options, bus, event, id, type, arg) {
  debug('got request for event: %s, %o', type, arg)

  switch (type) {
    case 'launch:browser':
      return
    case 'open:project':
      return
    case 'has:opened:cypress':
      return
    case 'ping:baseUrl':
      return
    default:
      throw new Error(`No ipc event registered for: '${type}'`)
  }
}

interface EventsStartArgs extends LaunchArgs {
  onFocusTests: () => void
}

export = {
  nullifyUnserializableValues,

  handleEvent,

  stop () {
    return ipc.removeAllListeners()
  },

  start (options: EventsStartArgs, bus: EventEmitter) {
    // curry left options
    // ipc.on('request', _.partial(this.handleEvent, options, bus))
  },
}
