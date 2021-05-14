import _ from 'lodash'
import { isJquery } from '../dom/jquery'

export interface CommandAttributes {
  args?: any[]
  assertionIndex?: number
  assertions?: any[]
  chainerId?: string
  fn?: Function
  injected?: boolean
  prev?: $Command
  next?: $Command
  name?: string
  logs?: object[]
  skip?: boolean
}

export class $Command {
  attributes: CommandAttributes = {}

  constructor (obj = {}) {
    this.reset()

    this.set(obj, undefined)
  }

  set (key, val) {
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

  _removeNonPrimitives (args) {
    // if the obj has options and
    // log is false, set it to true
    for (let i = args.length - 1; i >= 0; i--) {
      const arg = args[i]

      if (_.isObject(arg)) {
        // filter out any properties which arent primitives
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

    args = _.reduce(args, (memo, arg) => {
      arg = _.isString(arg) ? _.truncate(arg, { length: 20 }) : '...'
      memo.push(arg)

      return memo
    }, [] as any[])

    return `cy.${name}('${args.join(', ')}')`
  }

  // Combine all of the chain commands into a sequence
  stats () {
    const stats: Record<string, any> = []
    let current: $Command | undefined = this

    do {
      stats.push({
        name: current.attributes.name,
        args: current.attributes.args?.map((a) => serialize(a, current!.attributes.name)),
        injected: current.attributes.injected,
      })

      current = current.attributes.next
    } while (current)

    return stats
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
    return new $Command(obj)
  }
}

type Predicate = (...args: any) => boolean

const mask = new Set(['type', 'visit'])

function serialize (val, name = 'unknown') {
  try {
    for (const [fn, serializer] of serializers.entries()) {
      if (fn(val)) {
        return _.isString(serializer) ? serializer : serializer(val, name)
      }
    }
  } catch (e) {
    return `{err}${e?.message}`
  }

  return 'unknown'
}

const serializers = new Map<Predicate, string | Function>([
  [_.isElement, (el) => el.tagName ?? '<unknown>'],
  [isJquery, (jq) => `jquery{${Array.from(jq).map((el) => serialize(el)).join(',')}}`],
  [_.isString, (str, name) => mask.has(name) ? `string{${str.length}}` : str],
  [_.isArray, (arr) => `arr{${arr.map(serialize).join(',')}}`],
  [_.isFunction, (fn) => /^(.*?)(?:\)|=>)/.exec(fn.toString())?.[0] ?? 'fn'],
  [_.isPlainObject, 'object'],
  [_.isDate, 'date'],
  [_.isNumber, 'number'],
  [_.isRegExp, 'regex'],
  [_.isNull, 'null'],
  [_.isUndefined, 'undefined'],
])

// mixin lodash methods
_.each(['pick'], (method) => {
  return $Command.prototype[method] = function (...args) {
    args.unshift(this.attributes)

    return _[method].apply(_, args)
  }
})
