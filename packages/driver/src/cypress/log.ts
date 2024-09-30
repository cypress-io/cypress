import _, { DebouncedFunc } from 'lodash'
import $ from 'jquery'
import clone from 'clone'

import { HIGHLIGHT_ATTR, type ISnapshots } from '../cy/snapshots'
import $dom from '../dom'
import $utils from './utils'
import $errUtils from './error_utils'

import type { StateFunc } from './state'

// adds class methods for command, route, and agent logging
// including the intermediate $Log interface
const groupsOrTableRe = /^(groups|table)$/
const parentOrChildRe = /parent|child|system/
const SNAPSHOT_PROPS = 'id snapshots $el url coords highlightAttr scrollBy viewportWidth viewportHeight'.split(' ')
const DISPLAY_PROPS = 'id alias aliasType callCount displayName end err event functionName groupLevel hookId instrument isStubbed group hidden message method name numElements numResponses referencesAlias renderProps sessionInfo state testId timeout type url visible wallClockStartedAt testCurrentRetry'.split(' ')
const PROTOCOL_PROPS = DISPLAY_PROPS.concat(['snapshots', 'createdAtTimestamp', 'updatedAtTimestamp', 'scrollBy', 'coords', 'highlightAttr'])
const BLACKLIST_PROPS = 'snapshots'.split(' ')

const PROTOCOL_MESSAGE_TRUNCATION_LENGTH = 3000

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

  getProtocolProps: (attrs) => {
    return _.pick(attrs, PROTOCOL_PROPS)
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
  const current = state('current')

  // always set the chainerId of the log to ourselves
  // so it can be queried on later
  const chainerId = current && current.get('chainerId')

  // dont set any defaults if this
  // is an agent or route because we
  // may not even be inside of a command
  if (instrument === 'command') {
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

        const subject = current.get('subject')
        const ret = $dom.isElement(subject) ? $dom.getElements(subject) : subject

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
      obj.type = obj.type(current, cy.subjectChain(chainerId))
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
    isCrossOriginLog: Cypress.isCrossOriginSpecBridge,
    id: `log-${window.location.origin}-${counter}`,
    chainerId,
    state: 'pending',
    hidden: false,
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
    createdAtTimestamp: performance.now() + performance.timeOrigin,
    updatedAtTimestamp: performance.now() + performance.timeOrigin,
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
  createSnapshot: ISnapshots['createSnapshot']
  state: StateFunc
  config: any
  fireChangeEvent: DebouncedFunc<((log) => (void | undefined))>

  _hasInitiallyLogged: boolean = false
  private attributes: Record<string, any> = { }
  private _emittedAttrs: Record<string, any> = {}

  constructor (createSnapshot, state, config, fireChangeEvent) {
    this.createSnapshot = createSnapshot
    this.state = state
    this.config = config
    // only fire the log:state:changed event as fast as every 4ms
    this.fireChangeEvent = _.debounce(fireChangeEvent, 4)

    if (config('protocolEnabled')) {
      Cypress.once('test:after:run', () => {
        this.fireChangeEvent.flush()
      })
    }
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
    let obj = key

    if (_.isString(key)) {
      obj = {}
      obj[key] = val
    }

    // dont ever allow existing id's to be mutated
    if (this.attributes.id) {
      delete obj.id
    }

    // dont ever allow cross-origin log's updatedAtTimestamp value to be mutated by primary origin log
    if (Cypress.isCrossOriginSpecBridge || !(obj.isCrossOriginLog || this.attributes.isCrossOriginLog)) {
      obj.updatedAtTimestamp = performance.now() + performance.timeOrigin
    }

    const isHiddenLog = this.get('hidden') || obj.hidden

    if ('url' in obj) {
      // always stringify the url property
      obj.url = (obj.url != null ? obj.url : '').toString()
    }

    // convert onConsole to consoleProps
    // for backwards compatibility
    if (obj.onConsole) {
      obj.consoleProps = obj.onConsole
      delete obj.onConsole
    }

    // truncate message when log is hidden to prevent bloating memory
    // and the protocol database
    if (obj.message && this.config('protocolEnabled') && isHiddenLog) {
      obj.message = $utils
      .stringify(obj.message)
      .substring(0, PROTOCOL_MESSAGE_TRUNCATION_LENGTH)
    }

    // if we have an alias automatically
    // figure out what type of alias it is
    if (obj.alias) {
      _.defaults(obj, { aliasType: obj.$el ? 'dom' : 'primitive' })
    }

    _.extend(this.attributes, obj)

    // if we have an consoleProps then re-wrap it
    // cy.clock sets obj / cross origin logs come as objs
    if (obj && _.isFunction(obj.consoleProps)) {
      this.wrapConsoleProps()
    }

    if (obj.renderProps && _.isFunction(obj.renderProps) && isHiddenLog && this.config('protocolEnabled')) {
      this.wrapRenderProps()
    }

    if (obj && obj.$el) {
      this.setElAttrs()
    }

    this._hasInitiallyLogged && this.fireChangeEvent(this)

    return this
  }

  pick (...args) {
    return _.pick(this.attributes, args)
  }

  private addSnapshot (snapshot, options) {
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
      this.set('next', options.next)
    }

    return this
  }

  snapshot (name?, options: any = {}) {
    // bail early and don't snapshot if
    // 1. we're a cross-origin log tracked on the primary origin (the log on that origin will send their snapshot!)
    // 2. we're in headless mode
    // 3. or we're not storing tests and the protocol is not enabled
    if (
      (!Cypress.isCrossOriginSpecBridge && this.get('isCrossOriginLog'))
      || (!this.config('isInteractive')
      || (this.config('numTestsKeptInMemory') === 0)) && !this.config('protocolEnabled')) {
      return this
    }

    if (this.get('next')) {
      name = this.get('next')
      this.set('next', null)
    }

    const snapshot = this.createSnapshot(name, this.get('$el'), undefined, this)

    this.addSnapshot(snapshot, options)

    return this
  }

  error (err) {
    const logGroupIds = this.state('logGroupIds') || []

    // current log was responsible for creating the current log group so end the current group
    if (_.last(logGroupIds) === this.attributes.id) {
      this.endGroup()
    }

    this.set({
      ended: true,
      error: err,
      _error: undefined,
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
    return this.set({
      highlightAttr: HIGHLIGHT_ATTR,
      numElements: $el.length,
      visible: this.get('visible') ?? $el.length === $el.filter(':visible').length,
    })
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

    this.attributes.consoleProps = function (...invokedArgs) {
      const consoleObj: Record<string, any> = {
        name: _this.get('name'),
        type: _this.get('event') ? 'event' : 'command',
      }

      // TODO: right here we need to automatically
      // merge in "Yielded + Element" if there is an $el

      // and finally add error if one exists
      if (_this.get('error')) {
        _.defaults(consoleObj, {
          error: _this.getError(_this.get('error')),
        })
      }

      // add note if no snapshot exists on command instruments
      if ((_this.get('instrument') === 'command') && _this.get('snapshot') && !_this.get('snapshots')) {
        consoleObj.snapshot = 'The snapshot is missing. Displaying current state of the DOM.'
      } else {
        delete consoleObj.snapshot
      }

      // in the case a log is being recreated from the cross-origin spec bridge to the primary, consoleProps may be an Object
      const consoleObjResult = _.isFunction(consoleProps) ? consoleProps.apply(this, invokedArgs) : consoleProps

      // these are the expected properties on the consoleProps object
      const expectedProperties = ['name', 'type', 'error', 'snapshot', 'args', 'groups', 'table', 'props']
      const expectedPropertiesObj = _.reduce(_.pick(consoleObjResult, expectedProperties), (memo, value, key) => {
        // don't include properties with undefined values
        if (value !== undefined) {
          memo[key] = value
        }

        return memo
      }, consoleObj)
      // any other key/value pairs need to be added to the `props` property
      const rest = _.omit(consoleObjResult, expectedProperties)

      return _.extend(expectedPropertiesObj, {
        props: _.extend(rest, expectedPropertiesObj.props || {}),
      })
    }
  }

  wrapRenderProps () {
    const { renderProps } = this.attributes

    this.attributes.renderProps = function (...invokedArgs) {
      const renderedProps = renderProps.apply(this, invokedArgs)

      // truncate message when log is hidden to prevent bloating memory
      // and the protocol database
      if (renderedProps.message) {
        renderedProps.message = $utils
        .stringify(renderedProps.message)
        .substring(0, PROTOCOL_MESSAGE_TRUNCATION_LENGTH)
      }

      return renderedProps
    }
  }
}

class LogManager {
  logs: Record<string, boolean> = {}

  constructor () {
    this.fireChangeEvent = this.fireChangeEvent.bind(this)
  }

  trigger (log, event: 'command:log:added' | 'command:log:changed') {
    // bail if we never fired our initial log event
    if (!log._hasInitiallyLogged) {
      return
    }

    // bail if we've reset the logs due to a Cypress.abort
    if (!this.logs[log.get('id')]) {
      return
    }

    const attrs = log.toJSON()

    const logAttrsEqual = _.isEqualWith(log._emittedAttrs, attrs, (_objValue, _othValue, key) => {
      // if the key is 'updatedAtTimestamp' then we want to ignore it since it will always be different
      if (key === 'updatedAtTimestamp') {
        return true
      }

      return undefined
    })

    // only trigger this event if our last stored
    // emitted attrs do not match the current toJSON
    if (!logAttrsEqual) {
      log._emittedAttrs = attrs

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
    return (options: Cypress.InternalLogConfig = {}) => {
      if (!_.isObject(options)) {
        $errUtils.throwErrByPath('log.invalid_argument', { args: { arg: options } })
      }

      if (!config('protocolEnabled') && options.hidden !== undefined && options.hidden) {
        return
      }

      const log = new Log(cy.createSnapshot, state, config, this.fireChangeEvent)

      log.set(defaults(state, config, _.clone(options)))

      const onBeforeLog = state('onBeforeLog')

      // dont trigger log if this function
      // explicitly returns false
      if (_.isFunction(onBeforeLog)) {
        if (onBeforeLog.call(cy, log) === false) {
          return
        }
      }

      const command = state('current')

      if (command) {
        command.log(log)
      }

      // if snapshot was passed
      // in, go ahead and snapshot
      if (log.get('snapshot')) {
        log.snapshot()
      }

      if (log.get('error')) {
        log.error(log.get('error'))
      }

      log.wrapConsoleProps()

      // if the log isn't associated with a command, then we know it won't be retrying and we should just end it.
      if (!command || log.get('end')) {
        log.end()
      }

      this.addToLogs(log)
      this.triggerLog(log)

      return log
    }
  }
}

export function create (Cypress, cy, state, config) {
  counter = 0
  const logManager = new LogManager()

  return logManager.createLogFn(cy, state, config)
}
