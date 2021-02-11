import _ from 'lodash'
import { EventEmitter2 } from 'eventemitter2'
import { debug as Debug } from 'debug'
import Bluebird from 'bluebird'

const log = Debug('cypress:driver')

const proxyFunctions = ['emit', 'emitThen', 'emitMap']

const withoutFunctions = (arr) => {
  return _.reject(arr, _.isFunction)
}

let logEmit = true

type CyEvents = {
  proxyTo: (child: Events) => null
  emitMap: (eventName: string, ...args: any[]) => any[]
  emitThen: (eventName: string, ...args: any[]) => Bluebird<any[]>
  emitThenSeries: (eventName: string, ...args: any[]) => Bluebird<any[]>
}

type Events = EventEmitter2 & CyEvents

export function extend (obj): Events {
  const events: EventEmitter2 & Partial<CyEvents> = new EventEmitter2()

  events.setMaxListeners(Infinity)

  events.proxyTo = function (child) {
    const parent = obj

    for (let fn of proxyFunctions) {
      // create a closure
      const original = parent[fn]

      parent[fn] = function (...args) {
        const ret1 = original.apply(parent, args)

        // dont let our child emits also log
        logEmit = false

        const ret2 = child[fn].apply(child, args)

        logEmit = true

        // aggregate the results of the parent
        // and child
        switch (fn) {
          case 'emit':
            // boolean
            return ret1 || ret2
          case 'emitMap':
            // array of results
            return ret1.concat(ret2)
          case 'emitThen':
            return Bluebird.join(ret1, ret2, (a, a2) => {
              // array of results
              return a.concat(a2)
            })
          default:
            return
        }
      }
    }

    return null
  }

  const map = function (mapper) {
    return function (eventName, ...args) {
      const listeners = obj.listeners(eventName)

      // is our log enabled and have we not silenced
      // this specific object?
      if (log.enabled && logEmit) {
        log('emitted: \'%s\' to \'%d\' listeners - with args: %o', eventName, listeners.length, ...args)
      }

      const listener = (fn) => {
        return fn.apply(obj, args)
      }

      return mapper(listeners, listener)
    }
  }

  events.emitMap = map(_.map)
  events.emitThen = map(Bluebird.map)

  // is our log enabled and have we not silenced
  // this specific object?
  if (log.enabled) {
    const { emit } = events

    events.emit = function (eventName, ...args) {
      const ret = emit.apply(obj, [eventName, ...args])

      // bail early if we have turned
      // off logging temporarily
      if (logEmit === false) {
        return ret
      }

      if (args.length) {
        log('emitted: \'%s\' - with args: %o', eventName, ...withoutFunctions(args))
      } else {
        log('emitted: \'%s\'', eventName)
      }

      return ret
    }
  }

  _.extend(obj, events)

  // return the events object
  return events as Events
}
