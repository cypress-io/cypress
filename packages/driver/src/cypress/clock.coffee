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
