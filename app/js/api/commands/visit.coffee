do (Cypress, _) ->

  Cypress.addParentCommand

    visit: (url, options = {}) ->
      _.defaults options,
        timeout: 15000
        onBeforeLoad: ->
        onLoad: ->

      ## trigger that the remoteIframing is visiting
      ## an external URL
      @$remoteIframe.trigger "visit:start", url

      rootUrl = @config("rootUrl")
      url     = Cypress.Location.getRemoteUrl(url, rootUrl)

      ## backup the previous runnable timeout
      ## and the hook's previous timeout
      prevTimeout     = @_timeout()

      ## reset the timeout to our options
      @_timeout(options.timeout)

      win = @sync.window()

      new Promise (resolve, reject) =>
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
            resolve(win)
            Cypress.command()

          # ## any existing global variables will get nuked after it navigates
          @$remoteIframe.prop "src", Cypress.Location.createInitialRemoteSrc(url)