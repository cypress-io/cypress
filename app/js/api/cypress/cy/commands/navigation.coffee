$Cypress.register "Navigation", (Cypress, _, $) ->

  overrideRemoteLocationGetters = (cy, contentWindow) ->
    navigated = ->
      cy.urlChanged()

    Cypress.Location.override(contentWindow, navigated)

  Cypress.Cy.extend
    onBeforeLoad: (contentWindow) ->
      ## override the remote iframe getters
      overrideRemoteLocationGetters(@, contentWindow)

      current = @prop("current")

      return if not current

      options = _.last(current.args)
      options?.onBeforeLoad?(contentWindow)

    _href: (win, url) ->
      win.location.href = url

    loading: (options = {}) ->
      current = @prop("current")

      ## if we are visiting a page which caused
      ## the beforeunload, then dont output this command
      return if current?.name is "visit"

      ## bail if we dont have a runnable
      ## because beforeunload can happen at any time
      ## we may no longer be testing and thus dont
      ## want to fire a new loading event
      ## TODO
      ## this may change in the future since we want
      ## to add debuggability in the chrome console
      ## which at that point we may keep runnable around
      return if not @prop("runnable")

      _.defaults options,
        timeout: 20000

      command = Cypress.command
        type: "parent"
        name: "loading"
        message: "--waiting for new page to load---"
        onConsole: -> {}

      prevTimeout = @_timeout()

      @_clearTimeout()

      ready = @prop("ready")

      ready.promise
        .cancellable()
        .timeout(options.timeout)
        .then =>
          @_storeHref()
          @_timeout(prevTimeout)
          if Cypress.cy.$("[data-cypress-visit-error]").length
            try
              @throwErr("Loading the new page failed.", command)
            catch e
              @fail(e)
          else
            command.snapshot().end()
        .then =>
          ## null out our subject again after loading resolves
          ## to prevent chaining since our page is loading
          @nullSubject()

          ## return null here to prevent further promise chaining
          null
        .catch Promise.CancellationError, (err) ->
          ## dont do anything on cancellation errors
          return
        .catch Promise.TimeoutError, (err) =>
          try
            @throwErr "Timed out after waiting '#{options.timeout}ms' for your remote page to load.", command
          catch e
            ## must directly fail here else we potentially
            ## get unhandled promise exception
            @fail(e)

  Cypress.addParentCommand

    visit: (url, options = {}) ->
      if not _.isString(url)
        @throwErr("cy.visit() must be called with a string as its 1st argument")

      _.defaults options,
        log: true
        timeout: 20000
        onBeforeLoad: ->
        onLoad: ->

      if options.log
        command = Cypress.command()

      baseUrl = @config("baseUrl")
      url     = Cypress.Location.getRemoteUrl(url, baseUrl)

      ## backup the previous runnable timeout
      ## and the hook's previous timeout
      prevTimeout = @_timeout()

      ## clear the current timeout
      @_clearTimeout()

      win = @sync.window()

      p = new Promise (resolve, reject) =>
        visit = (win, url, options) =>
          # ## when the remote iframe's load event fires
          # ## callback fn
          @$remoteIframe.one "load", =>
            @_storeHref()
            @_timeout(prevTimeout)
            options.onLoad?(win)
            if Cypress.cy.$("[data-cypress-visit-error]").length
              try
                @throwErr("Could not load the remote page: #{url}", command)
              catch e
                reject(e)
            else
              command.snapshot().end() if command
              resolve(win)

          ## any existing global variables will get nuked after it navigates
          @$remoteIframe.prop "src", Cypress.Location.createInitialRemoteSrc(url)


        ## if we're visiting a page and we're not currently
        ## on about:blank then we need to nuke the window
        ## and after its nuked then visit the url
        if @sync.url({log: false}) isnt "about:blank"
          @$remoteIframe.one "load", =>
            visit(win, url, options)

          @_href(win, "about:blank")

        else
          visit(win, url, options)

      p
        .timeout(options.timeout)
        .catch Promise.TimeoutError, (err) =>
          @$remoteIframe.off("load")
          @throwErr "Timed out after waiting '#{options.timeout}ms' for your remote page to load.", command