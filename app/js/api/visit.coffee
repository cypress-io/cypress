## attach to Eclectus global

Eclectus.Visit = do ($, _, Eclectus) ->

  class Visit extends Eclectus.Command
    config:
      type: "visit"

    initialize: ->
      @canBeParent = false

    log: (url, fn) ->
      ## when the remote iframe's load event fires
      ## callback fn
      @$remoteIframe.one "load", fn

      url = encodeURIComponent(url)

      ## navigate the remote iframe to the url
      @$remoteIframe[0].contentWindow.location.href = "/remotes?url=#{url}"

      @emit
        method: "visit"
        message: url
        page: @$remoteIframe

  return Visit