## attach to Eclectus global

Eclectus.Visit = do ($, _, Eclectus) ->

  class Visit extends Eclectus.Command
    config:
      type: "visit"

    initialize: ->
      @canBeParent = false

    log: (url, options, fn) ->
      _.defaults options,
        timeout: 10000
        onBeforeLoad: ->
        onLoad: ->

      prevTimeout = @runnable.timeout()

      @runnable.timeout(options.timeout)
      @runnable.resetTimeout()

      win = @$remoteIframe[0].contentWindow

      ## trigger that the remoteIframing is visiting
      ## an external URL
      @$remoteIframe.trigger "visit:start", url

      ## when the remote iframe's load event fires
      ## callback fn
      @$remoteIframe.one "load", =>
        @$remoteIframe.trigger "visit:done"
        @runnable.timeout(prevTimeout)
        @runnable.resetTimeout()
        options.onLoad?(win)
        fn()

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