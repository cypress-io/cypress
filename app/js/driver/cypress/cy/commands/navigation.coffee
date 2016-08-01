$Cypress.register "Navigation", (Cypress, _, $, Promise) ->

  commandCausingLoading = /^(visit|reload)$/

  id                    = null
  previousDomainVisited = false

  Cypress.on "test:before:run", (test) ->
    ## continuously reset this
    ## before each test run!
    previousDomainVisited = false

    id = test.id

  overrideRemoteLocationGetters = (cy, contentWindow) ->
    navigated = (attr, args) ->
      cy.urlChanged(null, {
        by: attr
        args: args
      })

    Cypress.Location.override(Cypress, contentWindow, navigated)

  timedOutWaitingForPageLoad = (ms, log) ->
    $Cypress.Utils.throwErrByPath("navigation.timed_out", {
      onFail: log
      args: { ms }
    })

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

    _replace: (win, url) ->
      win.location.replace(url)

    _existing: ->
      Cypress.Location.create(window.location.href)

    _src: ($remoteIframe, url) ->
      $remoteIframe.prop("src", url)

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
        consoleProps: -> {
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
        timeout: Cypress.config("pageLoadTimeout")

      options._log = Cypress.Log.command
        type: "parent"
        name: "page load"
        message: "--waiting for new page to load---"
        event: true
        ## add a note here that loading nulled out the current subject?
        consoleProps: -> {
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
              $Cypress.Utils.throwErrByPath("navigation.loading_failed", { onFail: options._log })
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
            timedOutWaitingForPageLoad.call(@, options.timeout, options._log)
          catch e
            ## must directly fail here else we potentially
            ## get unhandled promise exception
            @fail(e)

  Cypress.addParentCommand
    reload: (args...) ->
      throwArgsErr = =>
        $Cypress.Utils.throwErrByPath("reload.invalid_arguments")

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

      ## clear the current timeout
      @_clearTimeout()

      cleanup = null

      p = new Promise (resolve, reject) =>
        forceReload ?= false
        options     ?= {}

        _.defaults options, {
          log: true
          timeout: Cypress.config("pageLoadTimeout")
        }

        if not _.isBoolean(forceReload)
          throwArgsErr()

        if not _.isObject(options)
          throwArgsErr()

        if options.log
          options._log = Cypress.Log.command()

          options._log.snapshot("before", {next: "after"})

        cleanup = =>
          Cypress.off "load", loaded

        loaded = =>
          cleanup()
          resolve @private("window")

        Cypress.on "load", loaded

        @private("window").location.reload(forceReload)

      .timeout(options.timeout)
      .catch Promise.TimeoutError, (err) =>
        cleanup()

        timedOutWaitingForPageLoad.call(@, options.timeout, options._log)

    go: (numberOrString, options = {}) ->
      _.defaults options, {
        log: true
        timeout: Cypress.config("pageLoadTimeout")
      }

      if options.log
        options._log = Cypress.Log.command()

      win = @private("window")

      goNumber = (num) =>
        if num is 0
          $Cypress.Utils.throwErrByPath("go.invalid_number", { onFail: options._log })

        didUnload = false
        pending   = Promise.pending()

        beforeUnload = ->
          didUnload = true

        resolve = ->
          pending.resolve()

        Cypress.on "before:unload", beforeUnload
        Cypress.on "load", resolve

        ## clear the current timeout
        @_clearTimeout()

        win.history.go(num)

        cleanup = =>
          Cypress.off "load", resolve

          ## need to set the attributes of 'go'
          ## consoleProps here with win

          ## make sure we resolve our go function
          ## with the remove window (just like cy.visit)
          @private("window")

        Promise.delay(100)
        .then =>
          ## cleanup the handler
          Cypress.off("before:unload", beforeUnload)

          ## if we've didUnload then we know we're
          ## doing a full page refresh and we need
          ## to wait until
          if didUnload
            pending.promise.then(cleanup)
          else
            cleanup()
        .timeout(options.timeout)
        .catch Promise.TimeoutError, (err) =>
          cleanup()
          timedOutWaitingForPageLoad.call(@, options.timeout, options._log)

      goString = (str) =>
        switch str
          when "forward" then goNumber(1)
          when "back"    then goNumber(-1)
          else
            $Cypress.Utils.throwErrByPath("go.invalid_direction", {
              onFail: options._log
              args: { str }
            })

      switch
        when _.isFinite(numberOrString) then goNumber(numberOrString)
        when _.isString(numberOrString) then goString(numberOrString)
        else
          $Cypress.Utils.throwErrByPath("go.invalid_argument", { onFail: options._log })

    visit: (url, options = {}) ->
      if not _.isString(url)
        $Cypress.Utils.throwErrByPath("visit.invalid_1st_arg")

      _.defaults options,
        log: true
        timeout: Cypress.config("pageLoadTimeout")
        onBeforeLoad: ->
        onLoad: ->

      if options.log
        options._log = Cypress.Log.command()

      baseUrl = Cypress.config("baseUrl")
      url     = Cypress.Location.getRemoteUrl(url, baseUrl)

      ## backup the previous runnable timeout
      ## and the hook's previous timeout
      prevTimeout = @_timeout()

      ## clear the current timeout
      @_clearTimeout()

      win           = @private("window")
      $remoteIframe = @private("$remoteIframe")
      runnable      = @private("runnable")

      resolveDomain = (url) ->
        url = Cypress.Location.createInitialRemoteSrc(url)

        new Promise (resolve) ->
          Cypress.trigger("resolve:domain", url, resolve)

      setDomain = (url) ->
        new Promise (resolve) ->
          Cypress.trigger("set:domain", url, resolve)

      p = new Promise (resolve, reject) =>

        resolveUrl = (url) ->
          strategy = Cypress.Location.getFetchStrategyForUrl(url)

          if strategy is "http"
            resolveDomain(url)
            .then (resp = {}) ->
              ## .then (resolvedUrl, statusCode, redirects, html, ok) ->
              ## display redirects
              ## display statusCode
              ## potentially hand back the failure url?
              ## so we can update the iframe directly?
              if resp.ok
                resp.url
              else
                debugger
            ## TODO: add .catch (err) ->
            ## support here
            ## and remove initial handling
            ## from the proxy layer completely

          else
            ## TODO: double check this
            ## file exists
            # checkForLocalFile(url)
            # .then ->
            Promise.resolve(url)
            # .catch (err) ->

        cannotVisit2ndDomain = (origin) ->
          try
            $Cypress.Utils.throwErrByPath("visit.cannot_visit_2nd_domain", {
              onFail: options._log
              args: {
                previousDomain: previousDomainVisited
                attemptedDomain: origin
              }
            })
          catch e
            return reject(e)

        visit = (win, url, options) =>
          ## when the remote iframe's load event fires
          ## callback fn
          ## TODO: why are we using $remoteIframe load event here
          ## instead of Cypress.on("load")?
          $remoteIframe.one "load", =>
            @_timeout(prevTimeout)
            options.onLoad?.call(runnable.ctx, win)
            if @$$("[data-cypress-visit-error]").length
              try
                $Cypress.Utils.throwErrByPath("visit.loading_failed", {
                  onFail: options._log
                  args: { url }
                })
              catch e
                reject(e)
            else
              options._log.set({url: url}).snapshot() if options._log

              resolve(win)

          ## hold onto our existing url
          existing = @_existing()

          ## in the case we are visiting a relative url
          ## then prepend the existing origin to it
          ## so we get the right remote url
          if not Cypress.Location.isFullyQualifiedUrl(url)
            remoteUrl = [existing.origin, url].join("/")

          remote = Cypress.Location.create(remoteUrl ? url)

          if previousDomainVisited and remote.originPolicy isnt existing.originPolicy
            ## if we've already visited a new superDomain
            ## then die else we'd be in a terrible endless loop
            return cannotVisit2ndDomain(remote.origin)

          resolveUrl(url)
          .then (url) =>
            setDomain(url)
            .then (remote = {}) =>
              {origin} = remote

              remote = Cypress.Location.create(origin)

              ## if the origin currently matches
              ## then go ahead and change the iframe's src
              ## and we're good to go
              # if origin is existing.origin
              if remote.originPolicy is existing.originPolicy
                previousDomainVisited = remote.origin

                Cypress.Cookies.setInitial()

                url = Cypress.Location.createInitialRemoteSrc(url)

                @_src($remoteIframe, url)
              else
                ## if we've already visited a new superDomain
                ## then die else we'd be in a terrible endless loop
                if previousDomainVisited
                  return cannotVisit2ndDomain(remote.origin)

                # Cypress.getScrollTop()
                # .then (val) ->
                ## tell our backend we're changing domains
                new Promise (resolve) ->
                  ## TODO: add in other things we want to preserve
                  ## state for like scrollTop
                  state = {
                    currentId: id
                    tests:     Cypress.getTestsState()
                    startTime: Cypress.getStartTime()
                    scrollTop: null
                  }

                  state.passed  = Cypress.countByTestState(state.tests, "passed")
                  state.failed  = Cypress.countByTestState(state.tests, "failed")
                  state.pending = Cypress.countByTestState(state.tests, "pending")
                  state.numLogs = Cypress.Log.countLogsByTests(state.tests)

                  Cypress.trigger("preserve:run:state", state, resolve)
                .then =>
                  ## and now we must change the url to be the new
                  ## origin but include the test that we're currently on
                  newUri = new Uri(origin)
                  newUri
                  .setPath(existing.pathname)
                  .setQuery(existing.search)
                  .setAnchor(existing.hash)

                  @_replace(window, newUri.toString())

        ## if we're visiting a page and we're not currently
        ## on about:blank then we need to nuke the window
        ## and after its nuked then visit the url
        if @_getLocation("href", win) isnt "about:blank"
          $remoteIframe.one "load", =>
            visit(win, url, options)

          @_href(win, "about:blank")

        else
          visit(win, url, options)

      p
      .timeout(options.timeout)
      .catch Promise.TimeoutError, (err) =>
        $remoteIframe.off("load")
        timedOutWaitingForPageLoad.call(@, options.timeout, options._log)
