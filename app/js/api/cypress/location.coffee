## TODO:
## 1. test these method implementations using encoded characters
## look at the spec to figure out whether we SHOULD be decoding them
## or leaving them as encoded.  also look at jsuri to see what it does
##
## 2. there is a bug when handling about:blank which borks it and
## turns it into about://blank

## attach to global
Cypress.Location = do (Cypress, _, Uri) ->

  reHttp = /^http/

  class Location
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
      @getToString()

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
      ## created our own custom toString method
      ## to fix some bugs with jsUri's implementation
      s = @remote.origin()

      if path = @remote.path()
        s += path

      if query = @remote.query()
        s += "?" if not _.str.include(query, "?")

        s += query

      if anchor = @remote.anchor()
        s += "#" if not _.str.include(anchor, "#")

        s += anchor

      return s

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
        toString: _.bind(@getToString, @)
      }

    ## think about moving this method out of Cypress
    ## and into our app, since it kind of leaks the
    ## remote + initial concerns, which could become
    ## constants which our server sends us during
    ## initial boot.
    @createInitialRemoteSrc = (url) ->
      ## prepend /__remote/ and strip any
      ## leading forward slashes
      url = "/__remote/" + _.ltrim(url, "/")
      url = new Uri(url)

      ## add the __intitial=true query param
      url.addQueryParam("__initial", true)

      ## return the full href
      url.toString()

    @isFullyQualifiedUrl = (url) ->
      reHttp.test(url)

    @getRemoteUrl = (url, baseUrl) ->
      ## if we have a root url and our url isnt full qualified
      if baseUrl and not @isFullyQualifiedUrl(url)
        ## prepend the root url to it
        return @prependBaseUrl(url, baseUrl)

      return url

    @prependBaseUrl = (url, baseUrl) ->
      ## prepends the baseUrl to the url and
      ## joins by / after trimming url for leading
      ## forward slashes
      [baseUrl, _.ltrim(url, "/")].join("/")

  Cypress.location = (current, remote, defaultOrigin) ->
    location = new Location(current, remote, defaultOrigin)
    location.getObject()

  return Location