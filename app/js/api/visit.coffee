## attach to Eclectus global

Eclectus.Visit = do ($, _, Eclectus) ->

  class Visit extends Eclectus.Command
    config:
      type: "visit"

    initialize: ->
      @canBeParent = false

    log: (url, options, fn) ->
      win = @$remoteIframe[0].contentWindow

      ## when the remote iframe's load event fires
      ## callback fn
      @$remoteIframe.one "load", ->
        options.onLoad?(win)
        fn()

      ## if our url is already has a query param
      ## then append our query param to it
      if _.str.include(url, "?")
        url += "&"
      else
        ## else create the query param
        url += "?"

      url += "__initial=true"

      ## any existing global variables will get nuked after it navigates
      # @$remoteIframe[0].contentWindow.location.href = "/__blank/"
      @$remoteIframe.prop "src", "/__remote/#{url}"

      ## poll the window to see if sinon has been executed
      ## if so, call our onBeforeLoad callback
      _.defer =>
        id = setInterval =>
          if win.sinon
            clearInterval(id)
            options.onBeforeLoad?(win)
            win = null
        , 3

      @emit
        method: "visit"
        message: url
        page: @$remoteIframe

  return Visit