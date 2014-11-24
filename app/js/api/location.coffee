## TODO:
## 1. test these method implementations using encoded characters
## look at the spec to figure out whether we SHOULD be decoding them
## or leaving them as encoded.  also look at jsuri to see what it does
##
## 2. there is a bug when handling about:blank which borks it and
## turns it into about://blank

## attach to global
Cypress.location = do (_, Uri) ->

  class Cypress.Location
    constructor: (current, remote = "", defaultOrigin) ->
      current  = new Uri(current)

      remote = @stripOrigin(current, remote)
      ## first strip off the current origin from the remote
      ## this will strip off http://0.0.0.0:3000
      ## location.origin isn't supported everywhere so we'll
      ## do it manually with Uri

      ## remove any __remote
      remote = @stripRemotePath(remote)

      ## convert to Uri instance
      ## from here on out we mutate
      ## this object directly
      @remote = new Uri(remote)

      @applyDefaultOrigin(defaultOrigin)

      ## remove the __initial=true query param
      @stripInitial()

    ## remove the current locations origin
    ## from our remote origin
    stripOrigin: (current, remote) ->
      origin = current.origin()
      remote.split(origin).join("")

    stripRemotePath: (remote) ->
      remote.split("/__remote/").join("")

    stripInitial: ->
      @remote.deleteQueryParam("__initial")

    applyDefaultOrigin: (origin) ->
      ## bail if we already have a remote origin
      return if @remote.origin()

      origin = new Uri(origin)

      @remote
        .setProtocol(origin.protocol())
        .setPort(origin.port())
        .setHost(origin.host())

    getHash: ->
      if hash = @remote.anchor()
        "#" + hash
      else
        ""

    getHref: ->
      @remote.toString()

    ## Location Host
    ## The URLUtils.host property is a DOMString containing the host,
    ## that is the hostname, and then, if the port of the URL is nonempty,
    ## a ':', and the port of the URL.
    getHost: ->
      _([@remote.host(), @remote.port()]).compact().join(":")

    getHostName: ->
      @remote.host()

    getOrigin: ->
      @remote.origin()

    getProtocol: ->
      @remote.protocol() + ":"

    getPathName: ->
      @remote.path() or "/"

    getPort: ->
      @remote.port()

    getSearch: ->
      @remote.query()

    getToString: ->
      _.bind(@remote.toString, @remote)

    getObject: ->
      {
        hash: @getHash()
        href: @getHref()
        host: @getHost()
        hostname: @getHostName()
        origin: @getOrigin()
        pathname: @getPathName()
        port: @getPort()
        protocol: @getProtocol()
        search: @getSearch()
        toString: @getToString()
      }

  create = (current, remote, defaultOrigin) ->
    location = new Cypress.Location(current, remote, defaultOrigin)
    location.getObject()

  return create