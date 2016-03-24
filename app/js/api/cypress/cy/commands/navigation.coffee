$Cypress.register "Navigation", (Cypress, _, $, Promise) ->

  commandCausingLoading = /^(visit|reload)$/

  overrideRemoteLocationGetters = (cy, contentWindow) ->
    navigated = (attr, args) ->
      cy.urlChanged(null, {
        by: attr
        args: args
      })

    Cypress.Location.override(Cypress, contentWindow, navigated)

  Cypress.on "before:window:load", (contentWindow) ->
    ## override the remote iframe getters
    overrideRemoteLocationGetters(@, contentWindow)

    current = @prop("current")

    return if not current

    runnable = @private("runnable")

    return if not runnable

    options = _.last(current.get("args"))
    options?.onBeforeLoad?.call(runnable.ctx, contentWindow)

  Cypress.Cy.extend
    _href: (win, url) ->
      win.location.href = url

    submitting: (e, options = {}) ->
      ## even though our beforeunload event
      ## should be firing shortly, lets just
      ## set the pageChangeEvent to true because
      ## there may be situations where it doesnt
      ## fire fast enough
      @prop("pageChangeEvent", true)

      Cypress.Log.command
        type: "parent"
        name: "form sub"
        message: "--submitting form---"
        event: true
        end: true
        snapshot: true
        onConsole: -> {
          "Originated From": e.target
        }

    loading: (options = {}) ->
      current = @prop("current")

      ## if we are visiting a page which caused
      ## the beforeunload, then dont output this command
      return if commandCausingLoading.test(current?.get("name"))

      ## bail if we dont have a runnable
      ## because beforeunload can happen at any time
      ## we may no longer be testing and thus dont
      ## want to fire a new loading event
      ## TODO
      ## this may change in the future since we want
      ## to add debuggability in the chrome console
      ## which at that point we may keep runnable around
      return if not @private("runnable")

      ## this tells the world that we're
      ## handling a page load event
      @prop("pageChangeEvent", true)

      _.defaults options,
        timeout: Cypress.config("visitTimeout")

      options._log = Cypress.Log.command
        type: "parent"
        name: "page load"
        message: "--waiting for new page to load---"
        event: true
        ## add a note here that loading nulled out the current subject?
        onConsole: -> {
          "Notes": "This page event automatically nulls the current subject. This prevents chaining off of DOM objects which existed on the previous page."
        }

      @_clearTimeout()

      ready = @prop("ready")

      ready.promise
        .cancellable()
        .timeout(options.timeout)
        .then =>
          if Cypress.cy.$$("[data-cypress-visit-error]").length
            try
              @throwErr("Loading the new page failed.", options._log)
            catch e
              @fail(e)
          else
            options._log.set("message", "--page loaded--").snapshot().end()

          ## return null to prevent accidental chaining
          return null
        .catch Promise.CancellationError, (err) ->
          ## dont do anything on cancellation errors
          return
        .catch Promise.TimeoutError, (err) =>
          try
            @throwErr "Timed out after waiting '#{options.timeout}ms' for your remote page to load.", options._log
          catch e
            ## must directly fail here else we potentially
            ## get unhandled promise exception
            @fail(e)

  Cypress.addParentCommand
    reload: (args...) ->
      throwArgsErr = =>
        @throwErr("cy.reload() can only accept a boolean or options as its arguments.")

      switch args.length
        when 0
          forceReload = false
          options     = {}

        when 1
          if _.isObject(args[0])
            options = args[0]
          else
            forceReload = args[0]

        when 2
          forceReload = args[0]
          options     = args[1]

        else
          throwArgsErr()

      new Promise (resolve, reject) =>
        forceReload ?= false
        options     ?= {}

        _.defaults options, {log: true}

        if not _.isBoolean(forceReload)
          throwArgsErr()

        if not _.isObject(options)
          throwArgsErr()

        if options.log
          options._log = Cypress.Log.command()

          options._log.snapshot("before", {next: "after"})

        Cypress.on "load", ->
          resolve @private("window")

        @private("window").location.reload(forceReload)

    go: (numberOrString, options = {}) ->
      _.defaults options, {log: true}

      if options.log
        options._log = Cypress.Log.command()

      win = @private("window")

      goNumber = (num) =>
        if num is 0
          @throwErr("cy.go() cannot accept '0'. The number must be greater or less than '0'.", options._log)

        didUnload = false
        pending   = Promise.pending()

        beforeUnload = ->
          didUnload = true

        resolve = ->
          pending.resolve()

        Cypress.on "before:unload", beforeUnload
        Cypress.on "load", resolve

        win.history.go(num)

        Promise.delay(100).then =>
          ## cleanup the handler
          Cypress.off("before:unload", beforeUnload)

          cleanup = =>
            Cypress.off "load", resolve

            ## need to set the attributes of 'go'
            ## onConsole here with win

            ## make sure we resolve our go function
            ## with the remove window (just like cy.visit)
            @private("window")

          ## if we've didUnload then we know we're
          ## doing a full page refresh and we need
          ## to wait until
          if didUnload
            pending.promise.then(cleanup)
          else
            cleanup()

      goString = (str) =>
        switch str
          when "forward" then goNumber(1)
          when "back"    then goNumber(-1)
          else
            @throwErr("cy.go() accepts either 'forward' or 'back'. You passed: '#{str}'", options._log)

      switch
        when _.isFinite(numberOrString) then goNumber(numberOrString)
        when _.isString(numberOrString) then goString(numberOrString)
        else
          @throwErr("cy.go() accepts only a string or number argument", options._log)

    visit: (url, options = {}) ->
      if not _.isString(url)
        @throwErr("cy.visit() must be called with a string as its 1st argument")

      _.defaults options,
        log: true
        timeout: Cypress.config("visitTimeout")
        onBeforeLoad: ->
        onLoad: ->

      if options.log
        options._log = Cypress.Log.command()

      baseUrl = @Cypress.config("baseUrl")
      url     = Cypress.Location.getRemoteUrl(url, baseUrl)

      ## backup the previous runnable timeout
      ## and the hook's previous timeout
      prevTimeout = @_timeout()

      ## clear the current timeout
      @_clearTimeout()

      win           = @private("window")
      $remoteIframe = @private("$remoteIframe")
      runnable      = @private("runnable")

      p = new Promise (resolve, reject) =>
        visit = (win, url, options) =>
          # ## when the remote iframe's load event fires
          # ## callback fn
          $remoteIframe.one "load", =>
            @_timeout(prevTimeout)
            options.onLoad?.call(runnable.ctx, win)
            if Cypress.cy.$$("[data-cypress-visit-error]").length
              try
                @throwErr("Could not load the remote page: #{url}", options._log)
              catch e
                reject(e)
            else
              options._log.set({url: url}).snapshot() if options._log

              resolve(win)

          ## any existing global variables will get nuked after it navigates
          $remoteIframe.prop "src", Cypress.Location.createInitialRemoteSrc(url)


        ## if we're visiting a page and we're not currently
        ## on about:blank then we need to nuke the window
        ## and after its nuked then visit the url
        if @_getLocation("href") isnt "about:blank"
          $remoteIframe.one "load", =>
            visit(win, url, options)

          @_href(win, "about:blank")

        else
          visit(win, url, options)

      p
        .timeout(options.timeout)
        .catch Promise.TimeoutError, (err) =>
          $remoteIframe.off("load")
          @throwErr "Timed out after waiting '#{options.timeout}ms' for your remote page to load.", options._log