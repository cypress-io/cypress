import _ from 'lodash'
import utils from './utils'

export class $Command {
  // `attributes` is initiated at reset(), but ts cannot detect it.
  // @ts-ignore
  attributes: Record<string, any>

  constructor (attrs: any = {}) {
    this.reset()

    // if the command came from a secondary origin, it already has an id
    if (!attrs.id) {
      // the id prefix needs to be unique per origin, so there are not
      // collisions when commands created in a secondary origin are passed
      // to the primary origin for the command log, etc.
      attrs.id = _.uniqueId(`cmd-${window.location.origin}-`)
    }

    this.set(attrs)
  }

  set (key, val?) {
    let obj

    if (_.isString(key)) {
      obj = {}
      obj[key] = val
    } else {
      obj = key
    }

    _.extend(this.attributes, obj)

    return this
  }

  finishLogs () {
    // finish each of the logs we have
    return _.invokeMap(this.get('logs'), 'finish')
  }

  log (log) {
    // always set the chainerId of the log to ourselves
    // so it can be queried on later
    log.set('chainerId', this.get('chainerId'))

    this.get('logs').push(log)

    return this
  }

  getLastLog () {
    // return the last non-event log
    const logs = this.get('logs')

    if (logs.length) {
      for (let i = logs.length - 1; i >= 0; i--) {
        const log = logs[i]

        if (log.get('event') === false) {
          return log
        }
      }
    }
  }

  hasPreviouslyLinkedCommand () {
    const prev = this.get('prev')

    return !!(prev && (prev.get('chainerId') === this.get('chainerId')))
  }

  is (str) {
    return this.get('type') === str
  }

  get (attr) {
    return this.attributes[attr]
  }

  toJSON () {
    return this.attributes
  }

  _removeNonPrimitives (args: Array<any> = []) {
    // if the obj has options and
    // log is false, set it to true
    for (let i = args.length - 1; i >= 0; i--) {
      const arg = args[i]

      if (_.isObject(arg)) {
        // filter out any properties which aren't primitives
        // to prevent accidental mutations
        const opts = _.omitBy(arg, _.isObject)

        // force command to log
        opts.log = true

        args[i] = opts

        return
      }
    }
  }

  skip () {
    return this.set('skip', true)
  }

  stringify () {
    let { name, args } = this.attributes

    args = _.reduce(args, (memo: string[], arg) => {
      arg = _.isString(arg) ? _.truncate(arg, { length: 20 }) : '...'
      memo.push(arg)

      return memo
    }, [])

    args = args.join(', ')

    return `cy.${name}('${args}')`
  }

  clone () {
    this._removeNonPrimitives(this.get('args'))

    return $Command.create(_.clone(this.attributes))
  }

  reset () {
    this.attributes = {}
    this.attributes.logs = []

    return this
  }

  static create (obj) {
    if (utils.isInstanceOf(obj, $Command)) {
      return obj
    }

    return new $Command(obj)
  }
}

// mixin lodash methods
_.each(['pick'], (method) => {
  return $Command.prototype[method] = function (...args) {
    args.unshift(this.attributes)

    return _[method].apply(_, args)
  }
})

export default $Command
