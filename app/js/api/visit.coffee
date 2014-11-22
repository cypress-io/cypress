## attach to Eclectus global

Eclectus.Visit = do ($, _, Eclectus) ->

  class Visit extends Eclectus.Command
    config:
      type: "visit"

    initialize: ->
      @canBeParent = false

    log: (url, options, fn) ->
      _.defaults options,
        timeout: 15000
        onBeforeLoad: ->
        onLoad: ->

      ## backup the previous runnable timeout
      ## and the hook's previous timeout
      @prevTimeout     = @runnable.timeout()

      ## reset both of them to our visit's
      ## timeout option
      @runnable.timeout(options.timeout)

      win = @$remoteIframe.prop("contentWindow")

      ## if we're visiting a page and we're not currently
      ## on about:blank then we need to nuke the window
      ## and after its nuked then visit the url
      if win.location.href isnt "about:blank"
        win.location.href = "about:blank"

        @$remoteIframe.one "load", =>
          @visit(win, url, fn, options)

      else
        @visit(win, url, fn, options)

    visit: (win, url, fn, options) ->
      ## trigger that the remoteIframing is visiting
      ## an external URL
      @$remoteIframe.trigger "visit:start", url

      ## when the remote iframe's load event fires
      ## callback fn
      @$remoteIframe.one "load", =>
        @runnable.timeout(@prevTimeout)
        options.onLoad?(win)
        fn(win, {checkLocation: false})

      ## if our url is already has a query param
      ## then append our query param to it
      if _.str.include(url, "?")
        url += "&"
      else
        ## else create the query param
        url += "?"

      ## any existing global variables will get nuked after it navigates
      # @$remoteIframe[0].contentWindow.location.href = "/__blank/"
      @$remoteIframe.prop "src", "/__remote/#{url}__initial=true"

      ## poll the window to see if sinon has been executed
      ## if so, call our onBeforeLoad callback
      ## currently this is firing too late
      ## when we visit google.com but works with todomvc
      id = setInterval =>
        if win.sinon
          clearInterval(id)
          options.onBeforeLoad?(win)
          win = null
      , 1

      @emit
        method: "visit"
        message: url
        page: @$remoteIframe

  return Visit