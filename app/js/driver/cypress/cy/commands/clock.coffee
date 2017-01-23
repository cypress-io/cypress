$Cypress.register "Clock", (Cypress, _) ->
  do (lolex) ->

    Cypress.on "test:before:run", ->
      ## remove clock before each test run, so a new one is created
      ## when user calls cy.clock()
      @prop("clock", null)

    Cypress.on "before:window:load", (contentWindow) ->
      ## if a clock has been created before this event (likely before
      ## a cy.visit(), then bind that clock to the new window
      if clock = @prop("clock")
        clock._bind(contentWindow)

    Cypress.on "restore", ->
      ## restore the clock if we've created one
      return if not @prop

      if clock = @prop("clock")
        clock.restore(false)

    Cypress.Cy.extend
      clock: (now, methods, options = {}) ->
        if @prop("clock")
          $Cypress.Utils.throwErrByPath("clock.already_created")

        if _.isObject(now)
          options = now
          now = undefined

        if _.isObject(methods) and !_.isArray(methods)
          options = methods
          methods = undefined

        if now? and !_.isNumber(now)
          $Cypress.Utils.throwErrByPath("clock.invalid_1st_arg", {args: {arg: now}})

        if methods? and not (_.isArray(methods) and _.every(methods, _.isString))
          $Cypress.Utils.throwErrByPath("clock.invalid_2nd_arg", {args: {arg: methods}})

        _.defaults options, {
          log: true
        }

        log = (message, snapshot = true, nowOffset = 0) ->
          if not options.log
            return

          details = clock._details()
          logNow = details.now + nowOffset
          logMethods = details.methods.slice()

          Cypress.Log.command({
            message: message
            name: "clock"
            type: "parent"
            end: true
            snapshot: snapshot
            event: true
            consoleProps: ->
              {
                "Now": logNow
                "Methods replaced": logMethods
              }
          })

        clock = $Cypress.Clock.create(@private("window"), now, methods)

        clock.tick = _.wrap clock.tick, (tick, ms) ->
          theLog = log("tick #{ms}ms", false, ms)
          if theLog
            theLog.snapshot("before", {next: "after"})
          ret = tick.call(clock, ms)
          if theLog
            theLog.snapshot().end()
          return ret

        clock.restore = _.wrap clock.restore, (restore, shouldLog = true) =>
          ret = restore.call(clock)
          if shouldLog
            log("restore")
          @prop("clock", null)
          return ret

        log("create / replace methods")

        @prop("clock", clock)
