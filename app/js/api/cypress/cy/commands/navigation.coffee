$Cypress.register "Navigation", (Cypress, _, $) ->

  Cypress.Cy.extend
    onBeforeLoad: (contentWindow) ->
      current = @prop("current")

      return if current?.name isnt "visit"

      options = _.last(current.args)
      options.onBeforeLoad?(contentWindow)

  Cypress.addParentCommand

    visit: (url, options = {}) ->
      if not _.isString(url)
        @throwErr("cy.visit() must be called with a string as its 1st argument")

      command = Cypress.command()

      _.defaults options,
        timeout: 15000
        onBeforeLoad: ->
        onLoad: ->

      baseUrl = @config("baseUrl")
      url     = $Cypress.Location.getRemoteUrl(url, baseUrl)

      ## trigger that the remoteIframing is visiting
      ## an external URL
      @$remoteIframe.trigger "visit:start", url

      ## backup the previous runnable timeout
      ## and the hook's previous timeout
      prevTimeout = @_timeout()

      ## clear the current timeout
      @_clearTimeout()

      win = @sync.window()

      p = new Promise (resolve, reject) =>
        ## if we're visiting a page and we're not currently
        ## on about:blank then we need to nuke the window
        ## and after its nuked then visit the url
        if @sync.url({log: false}) isnt "about:blank"
          win.location.href = "about:blank"

          @$remoteIframe.one "load", =>
            visit(win, url, options)

        else
          visit(win, url, options)

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
              command.snapshot().end()
              resolve(win)

          # ## any existing global variables will get nuked after it navigates
          @$remoteIframe.prop "src", $Cypress.Location.createInitialRemoteSrc(url)

      p
        .timeout(options.timeout)
        .catch Promise.TimeoutError, (err) =>
          @$remoteIframe.off("load")
          @throwErr "Timed out after waiting '#{options.timeout}ms' for your remote page to load.", command