## attach to Eclectus global

Eclectus.Visit = do ($, _, Eclectus) ->

  reHttp = /^http/

  class Visit extends Eclectus.Command
    config:
      type: "visit"

    initialize: ->
      @canBeParent = false

    fullyQualifiedUrl: (url) ->
      reHttp.test(url)

    prependRootUrl: (url, root) ->
      ## prepends the root to the url and
      ## joins by / after trimming url for leading
      ## forward slashes
      [root, _.ltrim(url, "/")].join("/")

    log: (url, options, fn) ->
      _.defaults options,
        timeout: 15000
        onBeforeLoad: ->
        onLoad: ->

      ## if we have a root url and our url isnt full qualified
      if options.rootUrl and not @fullyQualifiedUrl(url)
        ## prepend the root url to it
        url = @prependRootUrl(url, options.rootUrl)

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

      ## any existing global variables will get nuked after it navigates
      # @$remoteIframe[0].contentWindow.location.href = "/__blank/"
      @$remoteIframe.prop "src", Cypress.createInitialRemoteSrc(url)

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