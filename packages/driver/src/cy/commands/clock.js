_ = require("lodash")

$Clock = require("../../cypress/clock")
$errUtils = require("../../cypress/error_utils")

## create a global clock
clock = null

module.exports = (Commands, Cypress, cy, state, config) ->
  reset = ->
    if clock
      clock.restore({ log: false })

    clock = null

  ## reset before a run
  reset()

  ## remove clock before each test run, so a new one is created
  ## when user calls cy.clock()
  ##
  ## this MUST be prepended else if we are stubbing or spying on
  ## global timers they will be reset in agents before this runs
  ## its reset function
  Cypress.prependListener("test:before:run", reset)

  Cypress.on "window:before:load", (contentWindow) ->
    ## if a clock has been created before this event (likely before
    ## a cy.visit(), then bind that clock to the new window
    if clock
      clock.bind(contentWindow)

  Commands.addAll({ type: "utility" }, {
    clock: (subject, now, methods, options = {}) ->
      ctx = @

      if clock
        return clock

      if _.isObject(now)
        options = now
        now = undefined

      if _.isObject(methods) and !_.isArray(methods)
        options = methods
        methods = undefined

      if now? and !_.isNumber(now)
        $errUtils.throwErrByPath("clock.invalid_1st_arg", {args: {arg: JSON.stringify(now)}})

      if methods? and not (_.isArray(methods) and _.every(methods, _.isString))
        $errUtils.throwErrByPath("clock.invalid_2nd_arg", {args: {arg: JSON.stringify(methods)}})

      _.defaults options, {
        log: true
      }

      log = (name, message, snapshot = true, consoleProps = {}) ->
        if not options.log
          return

        details = clock.details()
        logNow = details.now
        logMethods = details.methods.slice()

        Cypress.log({
          name: name
          message: message ? ""
          type: "parent"
          end: true
          snapshot: snapshot
          consoleProps: ->
            _.extend({
              "Now": logNow
              "Methods replaced": logMethods
            }, consoleProps)
        })

      clock = $Clock.create(state("window"), now, methods)

      tick = clock.tick

      clock.tick = (ms) ->
        if ms? and not _.isNumber(ms)
          $errUtils.throwErrByPath("tick.invalid_argument", {args: {arg: JSON.stringify(ms)}})

        ms ?= 0

        theLog = log("tick", "#{ms}ms", false, {
          "Now": clock.details().now + ms
          "Ticked": "#{ms} milliseconds"
        })

        if theLog
          theLog.snapshot("before", {next: "after"})

        ret = tick.apply(@, arguments)

        if theLog
          theLog.snapshot().end()

        return ret

      restore = clock.restore

      clock.restore = (options = {}) ->
        ret = restore.apply(@, arguments)

        if options.log isnt false
          log("restore")

        ctx.clock = null

        clock = null

        state("clock", clock)

        return ret

      log("clock")

      state("clock", clock)

      return ctx.clock = clock

    tick: (subject, ms) ->
      if not clock
        $errUtils.throwErrByPath("tick.no_clock")

      clock.tick(ms)

      return clock
  })
