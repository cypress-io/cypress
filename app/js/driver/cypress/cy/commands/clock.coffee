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
        if _.isObject(now)
          options = now
        if _.isObject(methods) and !_.isArray(methods)
          options = methods

        _.defaults options, {
          log: true
        }

        log = (message, snapshot = true) ->
          if not options.log
            return

          Cypress.Log.command({
            message: message
            name: "clock"
            type: "parent"
            end: true
            snapshot: snapshot
            event: true
            consoleProps: ->
              {now, methods} = clock._details()
              {
                "Now": now
                "Methods replaced": methods
              }
          })

        if @prop("clock")
          $Cypress.Utils.throwErrByPath("clock.already_created")

        clock = $Cypress.Clock.create(@private("window"), now, methods)

        ## TODO: have tick take options, so log: false is possible?
        clock.tick = _.wrap clock.tick, (tick, ms) ->
          theLog = log("tick #{ms}", false)
          theLog.snapshot("before", {next: "after"})
          ret = tick.call(clock, ms)
          theLog.snapshot().end()
          return ret

        ## TODO: have restore take options, so log: false is possible?
        clock.restore = _.wrap clock.restore, (restore, shouldLog = true) =>
          ret = restore.call(clock)
          if shouldLog
            log("restore")
          @prop("clock", null)
          return ret

        log("create / replace methods")

        @prop("clock", clock)
