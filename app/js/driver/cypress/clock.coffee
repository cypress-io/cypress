$Cypress.Clock = do ($Cypress, _) ->

  class $Clock
    constructor: (win, now, @_methods, @_callbacks = {}) ->
      @_callbacks.onRestore ?= ->
      @_lolexClock = lolex.install(win, now, @_methods)

    tick: (ms) ->
      @_lolexClock.tick(ms)

    restore: ->
      @_callbacks.onRestore()
      @_lolexClock.uninstall()

    _bind: (win) ->
      @_lolexClock = lolex.install(win, @_lolexClock.now, @_methods)

    @create: (args...)->
      new $Clock(args...)

  return $Clock
