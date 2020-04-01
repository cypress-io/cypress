_ = require("lodash")
lolex = require("lolex")

install = (win, now, methods) ->
  lolex.withGlobal(win).install({
    target: win
    now
    toFake: methods
  })

create = (win, now, methods) ->
  clock = install(win, now, methods)

  tick = (ms) ->
    clock.tick(ms)

  restore = ->
    _.each clock.methods, (method) ->
      try
        ## before restoring the clock, we need to
        ## reset the hadOwnProperty in case a
        ## the application code eradicated the
        ## overridden clock method at a later time.
        ## this is a property that lolex using internally
        ## when restoring the global methods.
        ## https://github.com/cypress-io/cypress/issues/2850
        fn = clock[method]
        if fn and fn.hadOwnProperty and win[method]
          win[method].hadOwnProperty = true

    clock.uninstall()

  bind = (win) ->
    clock = install(win, now, methods)

  details = ->
    _.pick(clock, "now", "methods")

  return {
    tick

    restore

    bind

    details

  }

module.exports = {
  create
}
