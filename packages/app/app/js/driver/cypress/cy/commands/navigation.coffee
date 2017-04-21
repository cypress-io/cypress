$Cypress.register "Navigation", (Cypress, _, $, Promise, moment, UrlParse) ->

  commandCausingLoading = /^(visit|reload)$/

  id                    = null
  previousDomainVisited = false
  hasVisitedAboutBlank  = false

  Cypress.on "test:before:run", (test) ->
    ## continuously reset this
    ## before each test run!
    previousDomainVisited = false

    id = test.id

  Cypress.on "test:before:hooks", ->
    ## make sure we reset that we haven't
    ## visited about blank again
    hasVisitedAboutBlank = false

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

    _resolveUrl: (url) ->
      Cypress.triggerPromise("resolve:url", url)
      .then (resp = {}) ->
        switch
          ## if we didn't even get an OK response
          ## then immediately die
          when not resp.isOkStatusCode
            err = new Error
            err.gotResponse = true
            _.extend(err, resp)

            throw err

          when not resp.isHtml
            ## throw invalid contentType error
            err = new Error
            err.invalidContentType = true
            _.extend(err, resp)

            throw err

          else
            resp

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
        .catch (err) =>
          try
            {originPolicy} = Cypress.Location.create(window.location.href)

            Cypress.Utils.throwErrByPath("navigation.cross_origin", {
              onFail: options._log
              args: {
                message: err.message
                originPolicy: originPolicy
              }
            })
          catch e
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

      consoleProps = {}

      if options.log
        options._log = Cypress.Log.command({
          consoleProps: -> consoleProps
        })

      url = Cypress.Location.normalize(url)

      if baseUrl = Cypress.config("baseUrl")
        url = Cypress.Location.qualifyWithBaseUrl(baseUrl, url)

      ## backup the previous runnable timeout
      ## and the hook's previous timeout
      prevTimeout = @_timeout()

      ## clear the current timeout
      @_clearTimeout()

      win           = @private("window")
      $remoteIframe = @private("$remoteIframe")
      runnable      = @private("runnable")

      v = null

      p = new Promise (resolve, reject) =>

        visitFailedByErr = (err, url, fn) ->
          err.url = url

          Cypress.trigger("visit:failed", err)

          try
            fn()
          catch e
            reject(e)

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

        gotResponse = (err) ->
          err.gotResponse is true

        gotInvalidContentType = (err) ->
          err.invalidContentType is true

        bothUrlsMatchAndRemoteHasHash = (current, remote) ->
          ## the remote has a hash
          ## or the last char of href
          ## is a hash
          (remote.hash or remote.href.slice(-1) is "#") and

            ## both must have the same origin
            (current.origin is remote.origin) and

              ## both must have the same pathname
              (current.pathname is remote.pathname) and

                ## both must have the same query params
                (current.search is remote.search)

        visit = (win, url, options) =>
          onLoad = =>
            @_timeout(prevTimeout)
            options.onLoad?.call(runnable.ctx, win)

            options._log.set({url: url}) if options._log

            resolve(win)

          ## hold onto our existing url
          existing = @_existing()

          ## TODO: Cypress.Location.resolve(existing.origin, url)

          ## in the case we are visiting a relative url
          ## then prepend the existing origin to it
          ## so we get the right remote url
          if not Cypress.Location.isFullyQualifiedUrl(url)
            remoteUrl = Cypress.Location.fullyQualifyUrl(url)

          remote = Cypress.Location.create(remoteUrl ? url)

          ## store the existing hash now since
          ## we'll need to apply it later
          existingHash = remote.hash ? ""

          if previousDomainVisited and remote.originPolicy isnt existing.originPolicy
            ## if we've already visited a new superDomain
            ## then die else we'd be in a terrible endless loop
            return cannotVisit2ndDomain(remote.origin)

          current = Cypress.Location.create(win.location.href)

          ## if all that is changing is the hash then we know
          ## the browser won't actually make a new http request
          ## for this, and so we need to resolve onLoad immediately
          ## and bypass the actual visit resolution stuff
          if bothUrlsMatchAndRemoteHasHash(current, remote)
            @_src($remoteIframe, remote.href)
            return onLoad()

          if existingHash
            ## strip out the existing hash if we have one
            ## before telling our backend to resolve this url
            url = url.replace(existingHash, "")

          @_resolveUrl(url)
          .then (resp = {}) =>
            {url, originalUrl, cookies, redirects, filePath} = resp

            ## reapply the existing hash
            url         += existingHash
            originalUrl += existingHash

            if filePath
              consoleProps["File Served"] = filePath
            else
              if url isnt originalUrl
                consoleProps["Original Url"] = originalUrl

            if options.log and redirects and redirects.length
              indicateRedirects = ->
                [originalUrl].concat(redirects).join(" -> ")

              options._log.set({message: indicateRedirects()})

            consoleProps["Resolved Url"]  = url
            consoleProps["Redirects"]     = redirects
            consoleProps["Cookies Set"]   = cookies

            remote = Cypress.Location.create(url)

            ## if the origin currently matches
            ## then go ahead and change the iframe's src
            ## and we're good to go
            # if origin is existing.origin
            if remote.originPolicy is existing.originPolicy
              previousDomainVisited = remote.origin

              url = Cypress.Location.fullyQualifyUrl(url)

              ## when the remote iframe's load event fires
              ## callback fn
              $remoteIframe.one("load", onLoad)

              @_src($remoteIframe, url)
            else
              ## if we've already visited a new superDomain
              ## then die else we'd be in a terrible endless loop
              if previousDomainVisited
                return cannotVisit2ndDomain(remote.origin)

              ## tell our backend we're changing domains
              new Promise (resolve) ->
                ## TODO: add in other things we want to preserve
                ## state for like scrollTop
                state = {
                  currentId: id
                  tests:     Cypress.getTestsState()
                  startTime: Cypress.getStartTime()
                  emissions: Cypress.getEmissions()
                }

                state.passed  = Cypress.countByTestState(state.tests, "passed")
                state.failed  = Cypress.countByTestState(state.tests, "failed")
                state.pending = Cypress.countByTestState(state.tests, "pending")
                state.numLogs = Cypress.Log.countLogsByTests(state.tests)

                promises = Cypress.invoke("collect:run:state")

                Promise.all(promises)
                .then (a = []) ->
                  ## merge all the states together holla'
                  state = _.reduce a, (memo, obj) ->
                    _.extend(memo, obj)
                  , state

                  Cypress.trigger("preserve:run:state", state, resolve)
              .then =>
                ## and now we must change the url to be the new
                ## origin but include the test that we're currently on
                newUri = new UrlParse(remote.origin)
                newUri
                .set("pathname", existing.pathname)
                .set("query",    existing.search)
                .set("hash",     existing.hash)

                ## replace is broken in electron so switching
                ## to href for now
                # @_replace(window, newUri.toString())
                @_href(window, newUri.toString())
          .catch gotResponse, gotInvalidContentType, (err) ->
            visitFailedByErr err, err.originalUrl, ->
              args = {
                url:         err.originalUrl
                path:        err.filePath
                status:      err.status
                statusText:  err.statusText
                redirects:   err.redirects
                contentType: err.contentType
              }

              msg = switch
                when err.gotResponse
                  type = if err.filePath then "file" else "http"

                  "visit.loading_#{type}_failed"

                when err.invalidContentType
                  "visit.loading_invalid_content_type"

              $Cypress.Utils.throwErrByPath(msg, {
                onFail: options._log
                args: args
              })
          .catch (err) ->
            visitFailedByErr err, url, ->
              $Cypress.Utils.throwErrByPath("visit.loading_network_failed", {
                onFail: options._log
                args: {
                  url:   url
                  error: err
                  stack: err.stack
                }
              })

        ## if we've visiting for the first time during
        ## a test then we want to first visit about:blank
        ## so that we nuke the previous state. subsequent
        ## visits will not navigate to about:blank so that
        ## our history entries are intact
        if not hasVisitedAboutBlank
          hasVisitedAboutBlank = true

          $remoteIframe.one "load", =>
            v = visit(win, url, options)

          @_href(win, "about:blank")
        else
          v = visit(win, url, options)

      p
      .timeout(options.timeout)
      .catch Promise.TimeoutError, (err) =>
        v and v.cancel?()
        $remoteIframe.off("load")
        timedOutWaitingForPageLoad.call(@, options.timeout, options._log)
