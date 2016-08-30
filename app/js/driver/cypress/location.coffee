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
  ipAddressRe = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/

  class $Location
    constructor: (remote) ->
      @remote = new Uri remote

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

    getOriginPolicy: ->
      ## origin policy is comprised of
      ## protocol + superdomain
      ## and subdomain is not factored in
      _.compact([
        @getProtocol() + "//" + @getSuperDomain(),
        @getPort()
      ]).join(":")

    getSuperDomain: ->
      hostname = @getHostName()
      parts    = hostname.split(".")

      ## if this is an ip address then
      ## just return it straight up
      if ipAddressRe.test(hostname)
        return hostname

      switch parts.length
        when 1
          ## localhost => localhost
          hostname
        when 2
          ## stackoverflow.com => stackoverflow.com
          hostname
        else
          ## mail.google.com => google.com
          ## cart.shopping.co.uk => shopping.co.uk
          parts.slice(1).join(".")

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
        originPolicy: @getOriginPolicy()
        superDomain: @getSuperDomain()
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

    ## if we don't have a fully qualified url
    ## then ensure the url starts with a leading slash
    @createInitialRemoteSrc = (url) ->
      if @isFullyQualifiedUrl(url)
        url
      else
        a = document.createElement("a")
        a.href = "/" + _.ltrim(url, "/")
        a.href

    @isFullyQualifiedUrl = (url) ->
      reHttp.test(url)

    @missingProtocolAndHostIsLocalOrWww = (url) ->
      if url not instanceof Uri
        url = new Uri(url)

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
      ## if we have a root url and our url isnt full qualified or missing the protocol + host is local or www
      if baseUrl and (not @isFullyQualifiedUrl(url) and not @missingProtocolAndHostIsLocalOrWww(url))
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
        origin = @create(from).origin
        @join(origin, to)
      else
        @join(from, to)

    @create = (remote) ->
      location = new $Location(remote)
      location.getObject()

  return $Location