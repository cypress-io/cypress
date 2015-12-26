## TODO:
## 1. test these method implementations using encoded characters
## look at the spec to figure out whether we SHOULD be decoding them
## or leaving them as encoded.  also look at Uri to see what it does
##
## 2. there is a bug when handling about:blank which borks it and
## turns it into about://blank

## attach to global
$Cypress.Location = do ($Cypress, _, Uri) ->

  reHttp = /^https?:\/\//
  reWww = /^www/

  reLocalHost = /^(localhost|0\.0\.0\.0|127\.0\.0\.1)/

  class $Location
    constructor: (remote) ->
      ## need to handle <root> here
      ## if its root then we need to strip the origin
      ## to make the URL look relative
      ## else just strip out the origin and replace
      ## it with the remoteHost

      remote = new Uri remote

      ## if our URL has a FQDN in its
      ## path http://localhost:2020/http://localhost:3000/about
      ## then dont handle anything with the remoteHost
      if fqdn = @getFqdn(remote)
        remote = new Uri fqdn
      else
        ## get the remoteHost from our cookies
        remoteHost = $Cypress.Cookies.getRemoteHost()

        if remoteHost is "<root>"
          remoteHost = new Uri ""
        else
          remoteHost = new Uri remoteHost

        ## and just replace the current origin with
        ## the remoteHost origin
        remote.setProtocol remoteHost.protocol()
        remote.setHost remoteHost.host()
        remote.setPort remoteHost.port()

      @remote = remote

    getFqdn: (url) ->
      url = new Uri url

      ## strip off the initial leading slash
      ## since path always begins with that
      path = url.path().slice(1)

      ## if this path matches http its a FQDN
      ## and we can return it
      if reHttp.test(path)
        return path

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

    ## override pathname + query here
    @override = (Cypress, win, navigated) ->

      # getHistory = =>
      #   new Promise (resolve) ->
      #     Cypress.trigger "history:entries", resolve

      ## history does not fire events until a click or back has happened
      ## so we have to know when they do manually
      _.each ["back", "forward", "go", "pushState", "replaceState"], (attr) ->
        ## dont use underscore wrap here because its potentially very
        ## confusing for users and this manually override is faster anyway
        return if not orig = win.history?[attr]

        win.history[attr] = ->
          orig.apply(@, arguments)

          ## let our function know we've navigated
          navigated(attr, arguments)

    ## think about moving this method out of Cypress
    ## and into our app, since it kind of leaks the
    ## remote + initial concerns, which could become
    ## constants which our server sends us during
    ## initial boot.
    @createInitialRemoteSrc = (url) ->
      if not reHttp.test(url)
        remoteHost = "<root>"
      else
        url = new Uri(url)
        remoteHost = url.origin()

        ## strip out the origin because we cannot
        ## request a cross domain frame, it has to be proxied
        url = url.toString().replace(remoteHost, "")

      ## setup the cookies for remoteHost + initial
      $Cypress.Cookies.setInitialRequest(remoteHost)

      return "/" + _.ltrim(url, "/")

    @isFullyQualifiedUrl = (url) ->
      reHttp.test(url)

    @missingProtocolAndHostIsLocalOrWww = (url) ->
      str = url.toString()

      ## normalize the host for 'localhost'
      ## and then check if we are missing
      ## http and our host is
      ## localhost / 127.0.0.1 / 0.0.0.0
      return false if not (reLocalHost.test(str) or reWww.test(str) or @isUrlLike(str))

      switch url.protocol()
        when ""
          return true
        when "localhost"
          ## port will be contained in host()
          ## host will be contained in protocol()
          url.setPort url.host()
          url.setHost url.protocol()
          return true
        else
          return false

    @isUrlLike = (url) ->
      ## beta.cypress.io
      ## aws.amazon.com/bucket/foo
      ## foo.bar.co.uk
      ## foo.bar.co.uk/asdf
      url = url.split("/")[0].split(".")
      url.length is 3 or url.length is 4

    @handleRelativeUrl = (url) ->
      ## Uri will assume the host incorrectly
      ## when we omit a protocol and simply provide
      ## the 'path' as the string
      ## so we have to shift this back to the path
      ## to properly handle query params later
      ## and also juggle path potentially just being
      ## a forward slash
      url = new Uri(url)
      p = url.path()
      p = if p isnt "/" then p else ""
      url.setPath(url.host() + p)
      url.setHost("")
      url

    @normalizeUrl = (url) ->
      ## A properly formed URL will always have a trailing
      ## slash at the end of it
      ## http://localhost:8000/
      ##
      ## A url with a path (sub folder) does not necessarily
      ## have a trailing slash after it
      ## http://localhost:8000/app
      ##
      ## If the webserver redirects us we will follow those
      ## correctly
      ## http://getbootstrap.com/css => 301 http://getbootstrap.com/css/
      ##
      ## A file being served by the file system never has a leading slash
      ## or a trailing slash
      ## index.html NOT index.html/ or /index.html
      ##
      url = _.ltrim(url, "/")

      if reHttp.test(url) or reWww.test(url) or reLocalHost.test(url) or @isUrlLike(url)
        url = new Uri(url)
      else
        url = @handleRelativeUrl(url)

      ## automatically insert http:// if url host
      ## is localhost, 0.0.0.0, or 127.0.0.1
      ## and there isnt a protocol
      if @missingProtocolAndHostIsLocalOrWww(url)
        url.setProtocol "http"

      ## if we have a protocol but we dont
      ## have a path, then ensure there is a
      ## trailing slash at the end of the host
      if url.protocol() and not url.path()
        url.addTrailingSlash()

      _.ltrim url.toString(), "/"

    @getRemoteUrl = (url, baseUrl) ->
      ## if we have a root url and our url isnt full qualified
      if baseUrl and not @isFullyQualifiedUrl(url)
        ## prepend the root url to it
        url = @prependBaseUrl(url, baseUrl)

      return @normalizeUrl(url)

    @prependBaseUrl = (url, baseUrl) ->
      ## prepends the baseUrl to the url and
      ## joins by / after trimming url for leading
      ## forward slashes
      [_.trim(baseUrl, "/"), _.trim(url, "/")].join("/")

    @isAbsoluteRelative = (segment) ->
      ## does this start with a forward slash?
      segment and segment[0] is "/"

    @join = (from, rest...) ->
      last = _.last(rest)

      paths = _.reduce rest, (memo, segment) ->
        if segment is last
          memo.push _.ltrim(segment, "/")
        else
          memo.push _.trim(segment, "/")
        memo
      , [_.rtrim(from, "/")]

      paths.join("/")

    @resolve = (from, to) ->
      ## if to is fully qualified then
      ## just return that
      return to if @isFullyQualifiedUrl(to)

      ## else take from and figure out if
      ## to is relative or absolute-relative

      ## if to is absolute relative '/foo'
      if @isAbsoluteRelative(to)
        ## get origin from 'from'
        origin = @parse(from).origin
        @join(origin, to)
      else
        @join(from, to)

    # @create = (current, remote, defaultOrigin) ->
    #   location = new $Location(current, remote, defaultOrigin)
    #   location.getObject()

    @create = (remote) ->
      location = new $Location(remote)
      location.getObject()

    @parse = (url) ->
      location = new $Location(url)
      location.remote = new Uri(url)
      location.getObject()

  return $Location