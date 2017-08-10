## TODO:
## 1. test these method implementations using encoded characters
## look at the spec to figure out whether we SHOULD be decoding them
## or leaving them as encoded.  also look at UrlParse to see what it does
##
## 2. there is a bug when handling about:blank which borks it and
## turns it into about://blank

_ = require("lodash")
UrlParse = require("url-parse")

reHttp = /^https?:\/\//
reWww = /^www/

reLocalHost = /^(localhost|0\.0\.0\.0|127\.0\.0\.1)/
ipAddressRe = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/

class $Location
  constructor: (remote) ->
    @remote = new UrlParse remote

  getHash: ->
    @remote.hash

  getHref: ->
    @getToString()

  ## Location Host
  ## The URLUtils.host property is a DOMString containing the host,
  ## that is the hostname, and then, if the port of the URL is nonempty,
  ## a ':', and the port of the URL.
  getHost: ->
    @remote.host

  getHostName: ->
    @remote.hostname

  getOrigin: ->
    ## https://github.com/unshiftio/url-parse/issues/38
    if @remote.origin is "null"
      null
    else
      @remote.origin

  getProtocol: ->
    @remote.protocol

  getPathName: ->
    @remote.pathname or "/"

  getPort: ->
    @remote.port

  getSearch: ->
    @remote.query

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
    @remote.toString()

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

  @isFullyQualifiedUrl = (url) ->
    reHttp.test(url)

  @isUrlLike = (url) ->
    ## beta.cypress.io
    ## aws.amazon.com/bucket/foo
    ## foo.bar.co.uk
    ## foo.bar.co.uk/asdf
    url = url.split("/")[0].split(".")
    url.length is 3 or url.length is 4

  @fullyQualifyUrl = (url) ->
    return url if @isFullyQualifiedUrl(url)

    existing = new UrlParse(window.location.href)

    ## always normalize against our existing origin
    ## as the baseUrl so that we do not accidentally
    ## have relative url's
    url = new UrlParse(url, existing.origin)
    url.toString()

  @normalize = (url) ->
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
    if reHttp.test(url) or reWww.test(url) or reLocalHost.test(url) or @isUrlLike(url)
      ## if we're missing a protocol then go
      ## ahead and append it
      if not reHttp.test(url)
        url = "http://" + url

      url = new UrlParse(url)

      if not url.pathname
        url.set("pathname", "/")

      url.toString()
    else
      url

  @qualifyWithBaseUrl = (baseUrl, url) ->
    ## if we have a root url and our url isnt full qualified
    if baseUrl and (not @isFullyQualifiedUrl(url))
      ## prepend the root url to it
      url = @join(baseUrl, url)

    @fullyQualifyUrl(url)

  @isAbsoluteRelative = (segment) ->
    ## does this start with a forward slash?
    segment and segment[0] is "/"

  @join = (from, rest...) ->
    last = _.last(rest)

    paths = _.reduce rest, (memo, segment) ->
      if segment is last
        memo.push _.trimStart(segment, "/")
      else
        memo.push _.trim(segment, "/")
      memo
    , [_.trimEnd(from, "/")]

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

module.exports = $Location
