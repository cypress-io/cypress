import _ from 'lodash'
import utils from './utils'

let idCounter = 1

export class $Command {
  attributes!: Record<string, any>
  state: 'queued' | 'pending' | 'passed' | 'recovered' | 'failed' | 'skipped'

  constructor (attrs: any = {}) {
    this.reset()
    this.state = 'queued'

    // if the command came from a secondary origin, it already has an id
    if (!attrs.id) {
      // the id prefix needs to be unique per origin, so there are not
      // collisions when commands created in a secondary origin are passed
      // to the primary origin for the command log, etc.
      attrs.id = `${attrs.chainerId}-cmd-${idCounter++}`
    }

    this.set(attrs)
  }

  pass () {
    this.state = 'passed'
  }

  skip () {
    this.state = 'skipped'
  }

  fail () {
    this.state = 'failed'
  }

  recovered () {
    this.state = 'recovered'
  }

  start () {
    this.state = 'pending'
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
    // TODO: Investigate whether or not we can reuse snapshots between logs
    // that snapshot at the same time

    // Finish each of the logs we have, turning any potential errors into actual ones.
    this.get('logs').forEach((log) => {
      if (log.get('next') || !log.get('snapshots')) {
        log.snapshot()
      }

      if (log.get('_error')) {
        log.error(log.get('_error'))
      } else {
        log.set('snapshot', false)
        log.finish()
        if (Cypress.isCrossOriginSpecBridge) {
          log.fireChangeEvent.flush()
        }
      }
    })
  }

  log (log) {
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

  pick (...args) {
    args.unshift(this.attributes)

    return _.pick.apply(_, args as [Record<string, any>, any[]])
  }

  static create (obj) {
    if (utils.isInstanceOf(obj, $Command)) {
      return obj
    }

    return new $Command(obj)
  }
}

export default $Command
