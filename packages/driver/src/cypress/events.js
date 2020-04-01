// adds a custom lightweight event bus
// to the Cypress class

const _ = require('lodash')
const EE = require('eventemitter2')
const log = require('debug')('cypress:driver')
const Promise = require('bluebird')

const proxyFunctions = 'emit emitThen emitMap'.split(' ')

const withoutFunctions = (arr) => _.reject(arr, _.isFunction)

let logEmit = true

module.exports = {
  extend (obj) {
    const events = new EE

    events.setMaxListeners(Infinity)

    events.proxyTo = function (child) {
      const parent = obj

      for (let fn of proxyFunctions) {
        // create a closure
        (function (fn) {
          const original = parent[fn]

          parent[fn] = function () {
            // eslint-disable-next-line
            const ret1 = original.apply(parent, arguments)

            // dont let our child emits also log
            logEmit = false

            // eslint-disable-next-line
            const ret2 = child[fn].apply(child, arguments)

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
                // array of results
                return Promise.join(ret1, ret2, (a, a2) => {
                  return a.concat(a2)
                })
              default: null
            }
          }
        })(fn)
      }

      return null
    }

    events.emitMap = function (eventName, ...args) {
      const listeners = obj.listeners(eventName)

      // is our log enabled and have we not silenced
      // this specific object?
      if (log.enabled && logEmit) {
        log('emitted: \'%s\' to \'%d\' listeners - with args: %o', eventName, listeners.length, ...args)
      }

      const listener = (fn) => fn.apply(obj, args)

      // collect the results from the listeners
      return _.map(listeners, listener)
    }

    events.emitThen = function (eventName, ...args) {
      const listeners = obj.listeners(eventName)

      // is our log enabled and have we not silenced
      // this specific object?
      if (log.enabled && logEmit) {
        log('emitted: \'%s\' to \'%d\' listeners - with args: %o', eventName, listeners.length, ...args)
      }

      const listener = (fn) => fn.apply(obj, args)

      return Promise.map(listeners, listener)
    }

    // is our log enabled and have we not silenced
    // this specific object?
    if (log.enabled) {
      const {
        emit,
      } = events

      events.emit = function (eventName, ...args) {
        const ret = emit.apply(obj, [eventName].concat(args))

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
    return events
  },
}
