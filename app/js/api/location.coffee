## attach to global
Cypress.location = do (_) ->

  class Location
    constructor: (current, remote) ->
      # @originalUrl = url


      @current  = new Uri(current)
      @remote   = remote

      @stripOrigin()
      ## first strip off the current origin from the remote
      ## this will strip off http://0.0.0.0:3000
      ## location.origin isn't supported everywhere so we'll
      ## do it manually with Uri

      ## remove any __remote
      @stripRemotePath()

      ## convert to Uri instance
      @remote = new Uri(@remote)

      ## remove the __initial=true query param
      @stripInitial()

      # debugger

      # currentOrigin = new Uri(current).origin()

      # remote = @stripOrigin(current, remote)

    ## remove the current locations origin
    ## from our remote origin
    stripOrigin: ->
      origin = @current.origin()
      @remote = @remote.split(origin).join("")

    stripRemotePath: ->
      @remote = @remote.split("/__remote/").join("")

    stripInitial: ->
      @remote.deleteQueryParam("__initial")

    ## Location Host
    ## The URLUtils.host property is a DOMString containing the host,
    ## that is the hostname, and then, if the port of the URL is nonempty,
    ## a ':', and the port of the URL.
    getHost: ->
      _([@remote.host(), @remote.port()]).compact().join(":")

    getProtocol: ->
      @remote.protocol() + ":"

    getObject: ->
      ## pathname
      ## hash
      ## origin
      {
        href: @remote.toString()
        host: @getHost()
        hostname: @remote.host()
        port: @remote.port()
        protocol: @getProtocol()
        toString: _.bind(@remote.toString, @remote)
      }

  create = (current, remote) ->
    location = new Location(current, remote)
    location.getObject()

  return create
