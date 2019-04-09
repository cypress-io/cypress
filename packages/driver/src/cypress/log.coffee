_ = require("lodash")
$ = require("jquery")
clone = require("clone")

$Snapshots = require("../cy/snapshots")
$Events = require("./events")
$dom = require("../dom")
$utils = require("./utils")

## adds class methods for command, route, and agent logging
## including the intermediate $Log interface
CypressErrorRe  = /(AssertionError|CypressError)/
groupsOrTableRe = /^(groups|table)$/
parentOrChildRe = /parent|child/
ERROR_PROPS     = "message type name stack fileName lineNumber columnNumber host uncaught actual expected showDiff".split(" ")
SNAPSHOT_PROPS  = "id snapshots $el url coords highlightAttr scrollBy viewportWidth viewportHeight".split(" ")
DISPLAY_PROPS   = "id testCurrentRetry alias aliasType callCount displayName end err event functionName hookName instrument isStubbed message method name numElements numResponses referencesAlias renderProps state testId type url visible".split(" ")
BLACKLIST_PROPS = "snapshots".split(" ")

delay = null
counter = 0

{ HIGHLIGHT_ATTR } = $Snapshots

reduceMemory = (attrs) ->
  ## mutate attrs by nulling out
  ## object properties
  _.each attrs, (value, key) ->
    if _.isObject(value)
      attrs[key] = null

toSerializedJSON = (attrs) ->
  isDom      = $dom.isDom
  isWindow   = $dom.isWindow
  isDocument = $dom.isDocument
  isElement  = $dom.isElement

  stringify = (value, key) ->
    return null if key in BLACKLIST_PROPS

    switch
      when _.isArray(value)
        _.map(value, stringify)

      when isDom(value)
        $dom.stringify(value, "short")

      when _.isFunction(value) and groupsOrTableRe.test(key)
        value()

      when _.isFunction(value)
        value.toString()

      when _.isObject(value)
        ## clone to nuke circular references
        ## and blow away anything that throws
        try
          _.mapValues(clone(value), stringify)
        catch err
          null

      else
        value

  _.mapValues(attrs, stringify)

getDisplayProps = (attrs) ->
  _.pick(attrs, DISPLAY_PROPS)

getConsoleProps = (attrs) ->
  attrs.consoleProps

getSnapshotProps = (attrs) ->
  _.pick(attrs, SNAPSHOT_PROPS)

countLogsByTests = (tests = {}) ->
  return 0 if _.isEmpty(tests)

  _
  .chain(tests)
  .flatMap (test) ->
    [test, test.prevAttempts]
  .flatMap (tests) ->
    [].concat(tests.agents, tests.routes, tests.commands)
  .compact()
  .union([{id: 0}])
  .map("id")
  .max()
  .value()

## TODO: fix this
setCounter = (num) ->
  counter = num

setDelay = (val) ->
  delay = val ? 4

defaults = (state, config, obj) ->
  instrument = obj.instrument ? "command"

  ## dont set any defaults if this
  ## is an agent or route because we
  ## may not even be inside of a command
  if instrument is "command"
    current = state("current")

    ## we are logging a command instrument by default
    _.defaults(obj, current?.pick("name", "type"))

    ## force duals to become either parents or childs
    ## normally this would be handled by the command itself
    ## but in cases where the command purposely does not log
    ## then it could still be logged during a failure, which
    ## is why we normalize its type value
    if not parentOrChildRe.test(obj.type)
      ## does this command have a previously linked command
      ## by chainer id
      obj.type = if current.hasPreviouslyLinkedCommand() then "child" else "parent"

    _.defaults(obj, {
      event: false
      renderProps: -> {}
      consoleProps: ->
        ## if we don't have a current command just bail
        return {} if not current

        ret = if $dom.isElement(current.get("subject"))
          $dom.getElements(current.get("subject"))
        else
          current.get("subject")

        return { Yielded: ret }
    })

    # if obj.isCurrent
      ## stringify the obj.message (if it exists) or current.get("args")
    obj.message = $utils.stringify(obj.message ? current.get("args"))

    ## allow type to by a dynamic function
    ## so it can conditionally return either
    ## parent or child (useful in assertions)
    if _.isFunction(obj.type)
      obj.type = obj.type(current, state("subject"))

  getTestFromRunnable = (r) =>
    return r.ctx.currentTest || r

  getTestAttemptFromRunnable = (runnable) =>
    t = getTestFromRunnable(runnable)
    t._currentRetry || 0

  _.defaults(obj, {
    id:               (counter += 1)
    state:            "pending"
    instrument:       "command"
    url:              state("url")
    hookName:         state("hookName")
    testId:           state("runnable").id
    testCurrentRetry: getTestAttemptFromRunnable(state("runnable"))
    viewportWidth:    state("viewportWidth")
    viewportHeight:   state("viewportHeight")
    referencesAlias:  undefined
    alias:            undefined
    aliasType:        undefined
    message:          undefined
    renderProps: -> {}
    consoleProps: -> {}
  })

Log = (cy, state, config, obj) ->
  obj = defaults(state, config, obj)

  ## private attributes of each log
  attributes = {}

  return {
    get: (attr) ->
      if attr then attributes[attr] else attributes

    unset: (key) ->
      @set(key, undefined)

    invoke: (key) ->
      invoke = =>
        ## ensure this is a callable function
        ## and set its default to empty object literal
        fn = @get(key)

        if _.isFunction(fn)
          fn()
        else
          fn

      invoke() ? {}

    serializeError: ->
      if err = @get("error")
        _.reduce ERROR_PROPS, (memo, prop) ->
          if _.has(err, prop) or err[prop]
            memo[prop] = err[prop]

          memo
        , {}
      else
        null

    toJSON: ->
      _
      .chain(attributes)
      .omit("error")
      .omitBy(_.isFunction)
      .extend({
        err:          @serializeError()
        consoleProps: @invoke("consoleProps")
        renderProps:  @invoke("renderProps")
      })
      .value()

    set: (key, val) ->
      if _.isString(key)
        obj = {}
        obj[key] = val
      else
        obj = key

      if "url" of obj
        ## always stringify the url property
        obj.url = (obj.url ? "").toString()

      ## convert onConsole to consoleProps
      ## for backwards compatibility
      if oc = obj.onConsole
        obj.consoleProps = oc

      ## if we have an alias automatically
      ## figure out what type of alias it is
      if obj.alias
        _.defaults obj, {aliasType: if obj.$el then "dom" else "primitive"}

      ## dont ever allow existing id's to be mutated
      if attributes.id
        delete obj.id

      _.extend(attributes, obj)

      ## if we have an consoleProps function
      ## then re-wrap it
      if obj and _.isFunction(obj.consoleProps)
        @wrapConsoleProps()

      if obj and obj.$el
        @setElAttrs()

      @fireChangeEvent()

      return @

    pick: (args...) ->
      args.unshift(attributes)
      _.pick.apply(_, args)

    publicInterface: ->
      {
        get:        _.bind(@get, @)
        on:         _.bind(@on, @)
        off:        _.bind(@off, @)
        pick:       _.bind(@pick, @)
        attributes: attributes
      }

    snapshot: (name, options = {}) ->
      ## bail early and dont snapshot
      ## if we're in headless mode
      ## TODO: fix this
      if not config("isInteractive")
        return @

      _.defaults options,
        at: null
        next: null

      {body, htmlAttrs, headStyles, bodyStyles} = cy.createSnapshot(@get("$el"))

      obj = {
        name: name
        body: body
        htmlAttrs: htmlAttrs
        headStyles: headStyles
        bodyStyles: bodyStyles
      }

      snapshots = @get("snapshots") ? []

      ## insert at index 'at' or whatever is the next position
      snapshots[options.at or snapshots.length] = obj

      @set("snapshots", snapshots)

      if next = options.next
        fn = @snapshot
        @snapshot = ->
          ## restore the fn
          @snapshot = fn

          ## call orig fn with next as name
          fn.call(@, next)

      return @

    error: (err) ->
      @set({
        ended: true
        error: err
        state: "failed"
      })

      return @

    end: ->
      ## dont set back to passed
      ## if we've already ended
      return if @get("ended")

      @set({
        ended: true
        state: "passed"
      })

      return @

    getError: (err) ->
      ## dont log stack traces on cypress errors
      ## or assertion errors
      if CypressErrorRe.test(err.name)
        err.toString()
      else
        err.stack

    setElAttrs: ->
      $el = @get("$el")

      return if not $el

      if _.isElement($el)
        ## wrap the element in jquery
        ## if its just a plain element
        return @set("$el", $($el), {silent: true})

      ## if we've passed something like
      ## <window> or <document> here or
      ## a primitive then unset $el
      if not $dom.isJquery($el)
        return @unset("$el")

      ## make sure all $el elements are visible!
      obj = {
        highlightAttr: HIGHLIGHT_ATTR
        numElements:   $el.length
        visible:       $el.length is $el.filter(":visible").length
      }

      @set(obj, {silent: true})

    merge: (log) ->
      ## merges another logs attributes into
      ## ours by also removing / adding any properties
      ## on the original

      ## 1. calculate which properties to unset
      unsets = _.chain(attributes).keys().without(_.keys(log.get())...).value()

      _.each unsets, (unset) =>
        @unset(unset)

      ## 2. merge in any other properties
      @set(log.get())

    _shouldAutoEnd: ->
      ## must be autoEnd
      ## and not already ended
      ## and not an event
      ## and a command
      @get("autoEnd") isnt false and
        @get("ended") isnt true and
          @get("event") is false and
            @get("instrument") is "command"

    finish: ->
      ## end our command since our subject
      ## has been resolved at this point
      ## unless its already been 'ended'
      ## or has been specifically told not to auto resolve
      if @_shouldAutoEnd()
        @snapshot().end()

    wrapConsoleProps: ->
      _this = @

      consoleProps = attributes.consoleProps

      ## re-wrap consoleProps to set Command + Error defaults
      attributes.consoleProps = ->
        key = if _this.get("event") then "Event" else "Command"

        consoleObj = {}
        consoleObj[key] = _this.get("name")

        ## merge in the other properties from consoleProps
        _.extend consoleObj, consoleProps.apply(@, arguments)

        ## TODO: right here we need to automatically
        ## merge in "Yielded + Element" if there is an $el

        ## and finally add error if one exists
        if err = _this.get("error")
          _.defaults(consoleObj, {
            Error: _this.getError(err)
          })

        ## add note if no snapshot exists on command instruments
        if _this.get("instrument") is "command" and not _this.get("snapshots")
          consoleObj.Snapshot = "The snapshot is missing. Displaying current state of the DOM."
        else
          delete consoleObj.Snapshot

        return consoleObj
  }

create = (Cypress, cy, state, config) ->
  counter = 0
  logs = {}

  ## give us the ability to change the delay for firing
  ## the change event, or default it to 4
  delay ?= setDelay(config("logAttrsDelay"))

  trigger = (log, event) ->
    ## bail if we never fired our initial log event
    return if not log._hasInitiallyLogged

    ## bail if we've reset the logs due to a Cypress.abort
    return if not logs[log.get("id")]

    attrs = log.toJSON()

    ## only trigger this event if our last stored
    ## emitted attrs do not match the current toJSON
    if not _.isEqual(log._emittedAttrs, attrs)
      log._emittedAttrs = attrs

      log.emit(event, attrs)

      Cypress.action(event, attrs, log)

  triggerLog = (log) ->
    log._hasInitiallyLogged = true

    trigger(log, "command:log:added")

  addToLogs = (log) ->
    id = log.get("id")

    logs[id] = true

  logFn = (obj = {}) ->
    attributes = {}

    log = Log(cy, state, config, obj)

    ## add event emitter interface
    $Events.extend(log)

    triggerStateChanged = ->
      trigger(log, "command:log:changed")

    ## only fire the log:state:changed event
    ## as fast as every 4ms
    log.fireChangeEvent = _.debounce(triggerStateChanged, 4)

    log.set(obj)

    ## if snapshot was passed
    ## in, go ahead and snapshot
    log.snapshot() if log.get("snapshot")

    ## if end was passed in
    ## go ahead and end
    log.end({silent: true}) if log.get("end")

    if err = log.get("error")
      log.error(err, {silent: true})

    log.wrapConsoleProps()

    onBeforeLog = state("onBeforeLog")

    ## dont trigger log if this function
    ## explicitly returns false
    if _.isFunction(onBeforeLog)
      return if onBeforeLog.call(cy, log) is false

    ## set the log on the command
    state("current")?.log(log)

    addToLogs(log)

    triggerLog(log)

    return log

  logFn._logs = logs

  return logFn

module.exports = {
  reduceMemory

  toSerializedJSON

  getDisplayProps

  getConsoleProps

  getSnapshotProps

  countLogsByTests

  setCounter

  create
}
