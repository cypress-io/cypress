lolex = require("lolex")

class $Clock
  constructor: (win, now, @_methods) ->
    @_lolexClock = lolex.install(win, now, @_methods)

  tick: (ms) ->
    @_lolexClock.tick(ms)

  restore: ->
    @_lolexClock.uninstall()

  _bind: (win) ->
    @_lolexClock = lolex.install(win, @_lolexClock.now, @_methods)

  _details: ->
    {
      now: @_lolexClock.now
      methods: @_lolexClock.methods
    }

  @create = (args...)->
    new $Clock(args...)

module.exports = $Clock
