_ = require("lodash")
lolex = require("lolex")

install = (win, now, methods) ->
  lolex.install(win, now, methods)

create = (win, now, methods) ->
  clock = install(win, now, methods)

  tick = (ms) ->
    clock.tick(ms)

  restore = ->
    clock.uninstall()

  bind = (win) ->
    restore()
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
