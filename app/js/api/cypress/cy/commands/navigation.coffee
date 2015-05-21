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

    loading: (options = {}) ->
      current = @prop("current")

      ## if we are visiting a page which caused
      ## the beforeunload, then dont output this command
      return if current?.name is "visit"

      _.defaults options,
        timeout: 20000

      command = Cypress.command
        type: "parent"
        name: "loading"
        message: "--waiting for new page to load---"

      prevTimeout = @_timeout()

      @_clearTimeout()

      ready = @prop("ready")

      ready.promise
        .timeout(options.timeout)
        .then =>
          @_storeHref()
          @_timeout(prevTimeout)
          command.snapshot().end()
        .catch Promise.TimeoutError, (err) =>
          try
            @throwErr "Timed out after waiting '#{options.timeout}ms' for your remote page to load.", command
          catch err
            ready.reject(err)

  Cypress.addParentCommand

    visit: (url, options = {}) ->
      if not _.isString(url)
        @throwErr("cy.visit() must be called with a string as its 1st argument")

      command = Cypress.command()

      _.defaults options,
        timeout: 20000
        onBeforeLoad: ->
        onLoad: ->

      baseUrl = @config("baseUrl")
      url     = Cypress.Location.getRemoteUrl(url, baseUrl)

      ## backup the previous runnable timeout
      ## and the hook's previous timeout
      prevTimeout = @_timeout()

      ## clear the current timeout
      @_clearTimeout()

      win = @sync.window()

      p = new Promise (resolve, reject) =>
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

        ## any existing global variables will get nuked after it navigates
        @$remoteIframe.prop "src", Cypress.Location.createInitialRemoteSrc(url)

      p
        .timeout(options.timeout)
        .catch Promise.TimeoutError, (err) =>
          @$remoteIframe.off("load")
          @throwErr "Timed out after waiting '#{options.timeout}ms' for your remote page to load.", command