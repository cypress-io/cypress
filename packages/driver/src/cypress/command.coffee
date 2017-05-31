_ = require("lodash")

class $Command
  constructor: (obj = {}) ->
    @reset()

    @set(obj)

  set: (key, val) ->
    if _.isString(key)
      obj = {}
      obj[key] = val
    else
      obj = key

    _.extend @attributes, obj

    return @

  finishLogs: ->
    ## finish each of the logs we have
    _.invokeMap @get("logs"), "finish"

  log: (log) ->
    ## always set the chainerId of the log to ourselves
    ## so it can be queried on later
    log.set("chainerId", @get("chainerId"))

    @get("logs").push(log)

    return @

  getLastLog: ->
    ## return the last non-event log
    logs = @get("logs")
    if logs.length
      for log in logs by -1
        if log.get("event") is false
          return log
    else
      undefined

  hasPreviouslyLinkedCommand: ->
    prev = @get("prev")

    !!(prev and prev.get("chainerId") is @get("chainerId"))

  is: (str) ->
    @get("type") is str

  get: (attr) ->
    @attributes[attr]

  toJSON: ->
    @attributes

  _removeNonPrimitives: (args) ->
    ## if the obj has options and
    ## log is false, set it to true
    for arg, i in args by -1
      if _.isObject(arg)
        ## filter out any properties which arent primitives
        ## to prevent accidental mutations
        opts = _.omitBy(arg, _.isObject)

        ## force command to log
        opts.log = true

        args[i] = opts
        return

  skip: ->
    @set("skip", true)

  stringify: ->
    {name, args} = @attributes

    args = _.reduce args, (memo, arg) ->
      arg = if _.isString(arg) then _.truncate(arg, { length: 20 }) else "..."
      memo.push(arg)
      memo
    , []

    args = args.join(", ")

    "cy.#{name}('#{args}')"

  clone: ->
    @_removeNonPrimitives @get("args")
    $Command.create _.clone(@attributes)

  reset: ->
    @attributes = {}
    @attributes.logs = []

    return @

  @create = (obj) ->
    new $Command(obj)

## mixin lodash methods
_.each ["pick"], (method) ->
  $Command.prototype[method] = (args...) ->
    args.unshift(@attributes)
    _[method].apply(_, args)

module.exports = $Command
