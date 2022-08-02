import _ from 'lodash'
import $ from 'jquery'
import clone from 'clone'

import { HIGHLIGHT_ATTR } from '../cy/snapshots'
import { extend as extendEvents } from './events'
import $dom from '../dom'
import $utils from './utils'
import $errUtils from './error_utils'

import type { StateFunc } from './state'

// adds class methods for command, route, and agent logging
// including the intermediate $Log interface
const groupsOrTableRe = /^(groups|table)$/
const parentOrChildRe = /parent|child|system/
const SNAPSHOT_PROPS = 'id snapshots $el url coords highlightAttr scrollBy viewportWidth viewportHeight'.split(' ')
const DISPLAY_PROPS = 'id alias aliasType callCount displayName end err event functionName groupLevel hookId instrument isStubbed group message method name numElements showError numResponses referencesAlias renderProps state testId timeout type url visible wallClockStartedAt testCurrentRetry'.split(' ')
const BLACKLIST_PROPS = 'snapshots'.split(' ')

let counter = 0

export const LogUtils = {
  // mutate attrs by nulling out
  // object properties
  reduceMemory: (attrs) => {
    return _.each(attrs, (value, key) => {
      if (_.isObject(value)) {
        attrs[key] = null
      }
    })
  },

  toSerializedJSON (attrs) {
    const { isDom } = $dom

    const stringify = function (value, key) {
      if (BLACKLIST_PROPS.includes(key)) {
        return null
      }

      if (_.isArray(value)) {
        return _.map(value, stringify)
      }

      if (isDom(value)) {
        return $dom.stringify(value, 'short')
      }

      if (_.isFunction(value) && groupsOrTableRe.test(key)) {
        return value()
      }

      if (_.isFunction(value) || _.isSymbol(value)) {
        return value.toString()
      }

      if (_.isObject(value)) {
        // clone to nuke circular references
        // and blow away anything that throws
        try {
          return _.mapValues(clone(value), stringify)
        } catch (err) {
          return null
        }
      }

      return value
    }

    return _.mapValues(attrs, stringify)
  },

  getDisplayProps: (attrs) => {
    return {
      ..._.pick(attrs, DISPLAY_PROPS),
      hasSnapshot: !!attrs.snapshots,
      hasConsoleProps: !!attrs.consoleProps,
    }
  },

  getConsoleProps: (attrs) => {
    return attrs.consoleProps
  },

  getSnapshotProps: (attrs) => {
    return _.pick(attrs, SNAPSHOT_PROPS)
  },

  countLogsByTests (tests: Record<string, any> = {}) {
    if (_.isEmpty(tests)) {
      return 0
    }

    return _
    .chain(tests)
    .flatMap((test) => test.prevAttempts ? [test, ...test.prevAttempts] : [test])
    .flatMap<{id: string}>((tests) => [].concat(tests.agents, tests.routes, tests.commands))
    .compact()
    .union([{ id: '0' }])
    // id is a string in the form of 'log-origin-#', grab the number off the end.
    .map(({ id }) => parseInt((id.match(/\d*$/) || ['0'])[0]))
    .max()
    .value()
  },

  // TODO: fix this
  setCounter: (num) => {
    return counter = num
  },

  getCounter: () => {
    return counter
  },
}

const defaults = function (state: StateFunc, config, obj) {
  const instrument = obj.instrument != null ? obj.instrument : 'command'

  // dont set any defaults if this
  // is an agent or route because we
  // may not even be inside of a command
  if (instrument === 'command') {
    const current = state('current')

    // we are logging a command instrument by default
    _.defaults(obj, current != null ? current.pick('name', 'type') : undefined)

    // force duals to become either parents or childs
    // normally this would be handled by the command itself
    // but in cases where the command purposely does not log
    // then it could still be logged during a failure, which
    // is why we normalize its type value
    if (typeof obj.type === 'string' && !parentOrChildRe.test(obj.type)) {
      // does this command have a previously linked command
      // by chainer id
      obj.type = (current != null ? current.hasPreviouslyLinkedCommand() : undefined) ? 'child' : 'parent'
    }

    _.defaults(obj, {
      timeout: config('defaultCommandTimeout'),
      event: false,
      renderProps () {
        return {}
      },
      consoleProps () {
        // if we don't have a current command just bail
        if (!current) {
          return {}
        }

        const ret = $dom.isElement(current.get('subject')) ?
          $dom.getElements(current.get('subject'))
          :
          current.get('subject')

        return { Yielded: ret }
      },
    })

    // if obj.isCurrent
    // stringify the obj.message (if it exists) or current.get("args")
    obj.message = $utils.stringify(obj.message != null ? obj.message : (current != null ? current.get('args') : undefined))

    // allow type to by a dynamic function
    // so it can conditionally return either
    // parent or child (useful in assertions)
    if (_.isFunction(obj.type)) {
      const chainerId = current && current.get('chainerId')

      obj.type = obj.type(current, (state('subjects') || {})[chainerId])
    }
  }

  const runnable = state('runnable')

  const getTestAttemptFromRunnable = (runnable) => {
    if (!runnable) {
      return
    }

    const t = $utils.getTestFromRunnable(runnable)

    // @ts-ignore
    return t._currentRetry || 0
  }

  counter++

  _.defaults(obj, {
    id: `log-${window.location.origin}-${counter}`,
    state: 'pending',
    instrument: 'command',
    url: state('url'),
    hookId: state('hookId'),
    testId: runnable ? runnable.id : undefined,
    testCurrentRetry: getTestAttemptFromRunnable(state('runnable')),
    viewportWidth: state('viewportWidth'),
    viewportHeight: state('viewportHeight'),
    referencesAlias: undefined,
    alias: undefined,
    aliasType: undefined,
    message: undefined,
    timeout: undefined,
    wallClockStartedAt: new Date().toJSON(),
    renderProps () {
      return {}
    },
    consoleProps () {
      return {}
    },
  })

  const logGroupIds = state('logGroupIds') || []

  if (logGroupIds.length) {
    obj.group = _.last(logGroupIds)
    obj.groupLevel = logGroupIds.length
  }

  if (obj.groupEnd) {
    state('logGroupIds', _.slice(logGroupIds, 0, -1))
  }

  if (obj.groupStart) {
    state('logGroupIds', (logGroupIds).concat(obj.id))
  }

  return obj
}

export class Log {
  cy: any
  state: StateFunc
  config: any
  fireChangeEvent: ((log) => (void | undefined))
  obj: any

  private attributes: Record<string, any> = {}

  constructor (cy, state, config, fireChangeEvent, obj) {
    this.cy = cy
    this.state = state
    this.config = config
    // only fire the log:state:changed event as fast as every 4ms
    this.fireChangeEvent = _.debounce(fireChangeEvent, 4)
    this.obj = defaults(state, config, obj)

    extendEvents(this)
  }

  get (attr) {
    if (attr) {
      return this.attributes[attr]
    }

    return this.attributes
  }

  unset (key) {
    return this.set(key, undefined)
  }

  invoke (key) {
    const invoke = () => {
      // ensure this is a callable function
      // and set its default to empty object literal
      const fn = this.get(key)

      if (_.isFunction(fn)) {
        return fn()
      }

      return fn
    }

    return invoke() || {}
  }

  toJSON () {
    return _
    .chain(this.attributes)
    .omit('error')
    .omitBy(_.isFunction)
    .extend({
      err: $errUtils.wrapErr(this.get('error')),
      consoleProps: this.invoke('consoleProps'),
      renderProps: this.invoke('renderProps'),
    })
    .value()
  }

  set (key, val?) {
    if (_.isString(key)) {
      this.obj = {}
      this.obj[key] = val
    } else {
      this.obj = key
    }

    if ('url' in this.obj) {
      // always stringify the url property
      this.obj.url = (this.obj.url != null ? this.obj.url : '').toString()
    }

    // convert onConsole to consoleProps
    // for backwards compatibility
    if (this.obj.onConsole) {
      this.obj.consoleProps = this.obj.onConsole
    }

    // if we have an alias automatically
    // figure out what type of alias it is
    if (this.obj.alias) {
      _.defaults(this.obj, { aliasType: this.obj.$el ? 'dom' : 'primitive' })
    }

    // dont ever allow existing id's to be mutated
    if (this.attributes.id) {
      delete this.obj.id
    }

    _.extend(this.attributes, this.obj)

    // if we have an consoleProps function
    // then re-wrap it
    if (this.obj && _.isFunction(this.obj.consoleProps)) {
      this.wrapConsoleProps()
    }

    if (this.obj && this.obj.$el) {
      this.setElAttrs()
    }

    this.fireChangeEvent(this)

    return this
  }

  pick (...args) {
    return _.pick(this.attributes, args)
  }

  snapshot (name?, options: any = {}) {
    // bail early and don't snapshot if we're in headless mode
    // or we're not storing tests
    if (!this.config('isInteractive') || (this.config('numTestsKeptInMemory') === 0)) {
      return this
    }

    _.defaults(options, {
      at: null,
      next: null,
    })

    const snapshot = this.cy.createSnapshot(name, this.get('$el'))

    const snapshots = this.get('snapshots') || []

    // don't add snapshot if we couldn't create one, which can happen
    // if the snapshotting process errors
    // https://github.com/cypress-io/cypress/issues/15816
    if (snapshot) {
      // insert at index 'at' or whatever is the next position
      snapshots[options.at || snapshots.length] = snapshot
    }

    this.set('snapshots', snapshots)

    if (options.next) {
      const fn = this.snapshot

      this.snapshot = function () {
        // restore the fn
        this.snapshot = fn

        // call orig fn with next as name
        return fn.call(this, options.next)
      }
    }

    return this
  }

  error (err) {
    const logGroupIds = this.state('logGroupIds') || []

    // current log was responsible to creating the current log group so end the current group
    if (_.last(logGroupIds) === this.attributes.id) {
      this.endGroup()
    }

    this.set({
      ended: true,
      error: err,
      state: 'failed',
    })

    return this
  }

  end () {
    // dont set back to passed if we've already ended
    if (this.get('ended')) {
      // we do need to trigger the change event since
      // xhr onLoad and proxy-logging updateRequestWithResponse can sometimes
      // happen in a different order and the log data in each is different
      this.fireChangeEvent(this)

      return
    }

    this.set({
      ended: true,
      state: 'passed',
    })

    return this
  }

  endGroup () {
    this.state('logGroupIds', _.slice(this.state('logGroupIds'), 0, -1))
  }

  getError (err) {
    return err.stack || err.message
  }

  setElAttrs () {
    const $el = this.get('$el')

    if (!$el) {
      return
    }

    if (_.isElement($el)) {
      // wrap the element in jquery
      // if its just a plain element
      return this.set('$el', $($el))
    }

    // if we've passed something like
    // <window> or <document> here or
    // a primitive then unset $el
    if (!$dom.isJquery($el)) {
      return this.unset('$el')
    }

    // make sure all $el elements are visible!
    this.obj = {
      highlightAttr: HIGHLIGHT_ATTR,
      numElements: $el.length,
      visible: this.get('visible') ?? $el.length === $el.filter(':visible').length,
    }

    return this.set(this.obj, { silent: true })
  }

  merge (log) {
    // merges another logs attributes into
    // ours by also removing / adding any properties
    // on the original

    // 1. calculate which properties to unset
    const unsets = _.chain(this.attributes).keys().without(..._.keys(log.get())).value()

    _.each(unsets, (unset) => {
      return this.unset(unset)
    })

    // 2. merge in any other properties
    return this.set(log.get())
  }

  _shouldAutoEnd () {
    // must be autoEnd
    // and not already ended
    // and not an event
    // and a command
    return (this.get('autoEnd') !== false) &&
      (this.get('ended') !== true) &&
        (this.get('event') === false) &&
          (this.get('instrument') === 'command')
  }

  finish () {
    // end our command since our subject
    // has been resolved at this point
    // unless its already been 'ended'
    // or has been specifically told not to auto resolve
    if (this._shouldAutoEnd()) {
      if (this.get('snapshot') !== false) {
        this.snapshot()
      }

      return this.end()
    }

    return
  }

  wrapConsoleProps () {
    const _this = this

    const { consoleProps } = this.attributes

    this.attributes.consoleProps = function (...args) {
      const key = _this.get('event') ? 'Event' : 'Command'

      const consoleObj: Record<string, any> = {}

      consoleObj[key] = _this.get('name')

      // in the case a log is being recreated from the cross-origin spec bridge to the primary, consoleProps may be an Object
      const consoleObjDefaults = _.isFunction(consoleProps) ? consoleProps.apply(this, args) : consoleProps

      // merge in the other properties from consoleProps
      _.extend(consoleObj, consoleObjDefaults)

      // TODO: right here we need to automatically
      // merge in "Yielded + Element" if there is an $el

      // and finally add error if one exists
      if (_this.get('error')) {
        _.defaults(consoleObj, {
          Error: _this.getError(_this.get('error')),
        })
      }

      // add note if no snapshot exists on command instruments
      if ((_this.get('instrument') === 'command') && !_this.get('snapshots')) {
        consoleObj.Snapshot = 'The snapshot is missing. Displaying current state of the DOM.'
      } else {
        delete consoleObj.Snapshot
      }

      return consoleObj
    }
  }
}

class LogManager {
  logs: Record<string, any> = {}

  constructor () {
    this.fireChangeEvent = this.fireChangeEvent.bind(this)
  }

  trigger (log, event) {
    // bail if we never fired our initial log event
    if (!log._hasInitiallyLogged) {
      return
    }

    // bail if we've reset the logs due to a Cypress.abort
    if (!this.logs[log.get('id')]) {
      return
    }

    const attrs = log.toJSON()

    // only trigger this event if our last stored
    // emitted attrs do not match the current toJSON
    if (!_.isEqual(log._emittedAttrs, attrs)) {
      log._emittedAttrs = attrs

      log.emit(event, attrs)

      return Cypress.action(event, attrs, log)
    }
  }

  triggerLog (log) {
    log._hasInitiallyLogged = true

    return this.trigger(log, 'command:log:added')
  }

  addToLogs (log) {
    const id = log.get('id')

    this.logs[id] = true
  }

  fireChangeEvent (log) {
    return this.trigger(log, 'command:log:changed')
  }

  createLogFn (cy, state, config) {
    return (options: any = {}) => {
      if (!_.isObject(options)) {
        $errUtils.throwErrByPath('log.invalid_argument', { args: { arg: options } })
      }

      const log = new Log(cy, state, config, this.fireChangeEvent, options)

      log.set(options)

      // if snapshot was passed
      // in, go ahead and snapshot
      if (log.get('snapshot')) {
        log.snapshot()
      }

      // if end was passed in
      // go ahead and end
      if (log.get('end')) {
        log.end()
      }

      if (log.get('error')) {
        log.error(log.get('error'))
      }

      log.wrapConsoleProps()

      const onBeforeLog = state('onBeforeLog')

      // dont trigger log if this function
      // explicitly returns false
      if (_.isFunction(onBeforeLog)) {
        if (onBeforeLog.call(cy, log) === false) {
          return
        }
      }

      // set the log on the command
      const current = state('current')

      if (current) {
        current.log(log)
      }

      this.addToLogs(log)

      if (options.sessionInfo) {
        Cypress.emit('session:add', log.toJSON())
      }

      if (options.emitOnly) {
        return
      }

      this.triggerLog(log)

      // if not current state then the log is being run
      // with no command reference, so just end the log
      if (!current) {
        log.end()
      }

      return log
    }
  }
}

export function create (Cypress, cy, state, config) {
  counter = 0
  const logManager = new LogManager()

  return logManager.createLogFn(cy, state, config)
}
