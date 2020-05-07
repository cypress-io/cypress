_        = require("lodash")
utils    = require("./utils")
$Command = require("./command")

class $CommandQueue
  constructor: (cmds = []) ->
    @commands = cmds

  logs: (filters) ->
    logs = _.flatten @invokeMap("get", "logs")

    if filters
      matchesFilters = _.matches(filters)

      logs = _.filter logs, (log) ->
        matchesFilters(log.get())

    return logs

  add: (obj) ->
    if utils.isInstanceOf(obj, $Command)
      return obj
    else
      $Command.create(obj)

  get: ->
    @commands

  names: ->
    @invokeMap("get", "name")

  splice: (start, end, obj) ->
    cmd = @add(obj)
    @commands.splice(start, end, cmd)

    prev = @at(start - 1)
    next = @at(start + 1)

    if prev
      prev.set("next", cmd)
      cmd.set("prev", prev)

    if next
      next.set("prev", cmd)
      cmd.set("next", next)

    return cmd

  slice: ->
    cmds = @commands.slice.apply(@commands, arguments)
    $CommandQueue.create(cmds)

  at: (index) ->
    @commands[index]

  _filterByAttrs: (attrs, method) ->
    matchesAttrs = _.matches(attrs)

    _[method] @commands, (command) ->
      matchesAttrs(command.attributes)

  filter: (attrs) ->
    @_filterByAttrs(attrs, "filter")

  find: (attrs) ->
    @_filterByAttrs(attrs, "find")

  toJSON: ->
    @invokeMap("toJSON")

  reset: ->
    @commands.splice(0, @commands.length)

    return @

  @create = (cmds, options = {}) ->
    new $CommandQueue(cmds)

Object.defineProperty $CommandQueue.prototype, "length", {
  get: -> @commands.length
}

## mixin lodash methods
_.each ["invokeMap", "map", "first", "reduce", "reject", "last", "indexOf", "each"], (method) ->
  $CommandQueue.prototype[method] = (args...) ->
    args.unshift(@commands)
    _[method].apply(_, args)

module.exports = $CommandQueue
