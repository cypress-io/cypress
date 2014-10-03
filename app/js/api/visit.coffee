## attach to Eclectus global

Eclectus.Visit = do ($, _, Eclectus) ->

  class Visit extends Eclectus.Command
    config:
      type: "visit"

    initialize: ->
      @canBeParent = false

    log: ($remote, url, fn) ->
      ## when the remote iframe's load event fires
      ## callback fn
      $remote.one "load", fn

      ## navigate the remote iframe to the url
      $remote[0].contentWindow.location.href = "/remotes/?url=#{url}"

      @emit
        method: "visit"
        message: url
        page: $remote

  return Visit