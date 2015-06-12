SecretSauce =
  mixin: (module, klass) ->
    for key, fn of @[module]
      klass.prototype[key] = fn

SecretSauce.Keys =
  _convertToId: (index) ->
    ival = index.toString(36)
    ## 0 pad number to ensure three digits
    [0,0,0].slice(ival.length).join("") + ival

  _getProjectKeyRange: (id) ->
    @cache.getProject(id).get("RANGE")

  ## Lookup the next Test integer and update
  ## offline location of sync
  getNextTestNumber: (projectId) ->
    @_getProjectKeyRange(projectId)
    .then (range) =>
      return @_getNewKeyRange(projectId) if range.start is range.end

      range.start += 1
      range
    .then (range) =>
      range = JSON.parse(range) if SecretSauce._.isString(range)
      @Log.info "Received key range", {range: range}
      @cache.updateRange(projectId, range)
      .return(range.start)

  nextKey: ->
    @project.ensureProjectId().bind(@)
    .then (projectId) ->
      @cache.ensureProject(projectId).bind(@)
      .then -> @getNextTestNumber(projectId)
      .then @_convertToId

SecretSauce.Socket =
  leadingSlashes: /^\/+/

  onTestFileChange: (filePath, stats) ->
    @Log.info "onTestFileChange", filePath: filePath

    ## simple solution for preventing firing test:changed events
    ## when we are making modifications to our own files
    return if @app.enabled("editFileMode")

    ## return if we're not a js or coffee file.
    ## this will weed out directories as well
    return if not /\.(js|coffee)$/.test filePath

    @fs.statAsync(filePath).bind(@)
      .then ->
        ## strip out our testFolder path from the filePath, and any leading forward slashes
        filePath      = filePath.split(@app.get("cypress").projectRoot).join("").replace(@leadingSlashes, "")
        strippedPath  = filePath.replace(@app.get("cypress").testFolder, "").replace(@leadingSlashes, "")

        @Log.info "generate:ids:for:test", filePath: filePath, strippedPath: strippedPath
        @io.emit "generate:ids:for:test", filePath, strippedPath
      .catch(->)

  closeWatchers: ->
    if f = @watchedTestFile
      f.close()

  watchTestFileByPath: (testFilePath) ->
    ## normalize the testFilePath
    testFilePath = @path.join(@testsDir, testFilePath)

    ## bail if we're already watching this
    ## exact file
    return if testFilePath is @testFilePath

    @Log.info "watching test file", {path: testFilePath}

    ## store this location
    @testFilePath = testFilePath

    ## close existing watchedTestFile(s)
    ## since we're now watching a different path
    @closeWatchers()

    new @Promise (resolve, reject) =>
      @watchedTestFile = @chokidar.watch testFilePath
      @watchedTestFile.on "change", @onTestFileChange.bind(@)
      @watchedTestFile.on "ready", =>
        resolve @watchedTestFile
      @watchedTestFile.on "error", (err) =>
        @Log.info "watching test file failed", {error: err, path: testFilePath}
        reject err

  onFixture: (fixture, cb) ->
    @Fixtures(@app).get(fixture)
      .then(cb)
      .catch (err) ->
        cb({__error: err})

  _startListening: (chokidar, path) ->
    { _ } = SecretSauce

    messages = {}

    @io.on "connection", (socket) =>
      @Log.info "socket connected"

      socket.on "remote:connected", =>
        @Log.info "remote:connected"

        return if socket.inRemoteRoom

        socket.inRemoteRoom = true
        socket.join("remote")

        socket.on "remote:response", (id, response) =>
          if message = messages[id]
            delete messages[id]
            @Log.info "remote:response", id: id, response: response
            message(response)

      socket.on "client:request", (message, data, cb) =>
        ## if cb isnt a function then we know
        ## data is really the cb, so reassign it
        ## and set data to null
        if not _.isFunction(cb)
          cb = data
          data = null

        id = @uuid.v4()

        @Log.info "client:request", id: id, msg: message, data: data

        if _.keys(@io.sockets.adapter.rooms.remote).length > 0
          messages[id] = cb
          @io.to("remote").emit "remote:request", id, message, data
        else
          cb({__error: "Could not process '#{message}'. No remote servers connected."})

      socket.on "watch:test:file", (filePath) =>
        @watchTestFileByPath(filePath)

      socket.on "generate:test:id", (data, fn) =>
        @Log.info "generate:test:id", data: data

        @idGenerator.getId(data)
        .then(fn)
        .catch (err) ->
          console.log "\u0007", err.details, err.message
          fn(message: err.message)

      socket.on "fixture", =>
        @onFixture.apply(@, arguments)

      socket.on "finished:generating:ids:for:test", (strippedPath) =>
        @Log.info "finished:generating:ids:for:test", strippedPath: strippedPath
        @io.emit "test:changed", file: strippedPath

      _.each "load:spec:iframe command:add runner:start runner:end before:run before:add after:add suite:add suite:start suite:stop test test:add test:start test:end after:run test:results:ready exclusive:test".split(" "), (event) ->
        socket.on event, (args...) =>
          args = _.chain(args).compact().reject(_.isFunction).value()
          @io.emit event, args...

      ## when we're told to run:sauce we receive
      ## the spec and callback with the name of our
      ## sauce labs job
      ## we'll embed some additional meta data into
      ## the job name
      socket.on "run:sauce", (spec, fn) =>
        ## this will be used to group jobs
        ## together for the runs related to 1
        ## spec by setting custom-data on the job object
        batchId = Date.now()

        jobName = @app.get("cypress").testFolder + "/" + spec
        fn(jobName, batchId)

        ## need to handle platform/browser/version incompatible configurations
        ## and throw our own error
        ## https://saucelabs.com/platforms/webdriver
        jobs = [
          { platform: "Windows 8.1", browser: "internet explorer",  version: 11 }
          { platform: "Windows 7",   browser: "internet explorer",  version: 10 }
          { platform: "Linux",       browser: "chrome",             version: 37 }
          { platform: "Linux",       browser: "firefox",            version: 33 }
          { platform: "OS X 10.9",   browser: "safari",             version: 7 }
        ]

        normalizeJobObject = (obj) ->
          obj = _(obj).clone()

          obj.browser = {
            "internet explorer": "ie"
          }[obj.browserName] or obj.browserName

          obj.os = obj.platform

          _(obj).pick "name", "browser", "version", "os", "batchId", "guid"

        _.each jobs, (job) =>
          options =
            host:        "0.0.0.0"
            port:        @app.get("port")
            name:        jobName
            batchId:     batchId
            guid:        uuid.v4()
            browserName: job.browser
            version:     job.version
            platform:    job.platform

          clientObj = normalizeJobObject(options)
          socket.emit "sauce:job:create", clientObj

          df = jQuery.Deferred()

          df.progress (sessionID) ->
            ## pass up the sessionID to the previous client obj by its guid
            socket.emit "sauce:job:start", clientObj.guid, sessionID

          df.fail (err) ->
            socket.emit "sauce:job:fail", clientObj.guid, err

          df.done (sessionID, runningTime, passed) ->
            socket.emit "sauce:job:done", sessionID, runningTime, passed

          sauce options, df

    @testsDir = path.join(@app.get("cypress").projectRoot, @app.get("cypress").testFolder)

    @fs.ensureDirAsync(@testsDir).bind(@)

    ## BREAKING DUE TO __DIRNAME
    # watchCssFiles = chokidar.watch path.join(__dirname, "public", "css"), ignored: (path, stats) ->
    #   return false if fs.statSync(path).isDirectory()

    #   not /\.css$/.test path

    # # watchCssFiles.on "add", (path) -> console.log "added css:", path
    # watchCssFiles.on "change", (filePath, stats) =>
    #   filePath = path.basename(filePath)
    #   @io.emit "eclectus:css:changed", file: filePath

SecretSauce.IdGenerator =
  hasExistingId: (e) ->
    e.idFound

  idFound: ->
    e = new Error
    e.idFound = true
    throw e

  nextId: (data) ->
    @keys.nextKey().bind(@)
    .then((id) ->
      @Log.info "Appending ID to Spec", {id: id, spec: data.spec, title: data.title}
      @appendTestId(data.spec, data.title, id)
      .return(id)
    )
    .catch (e) ->
      @logErr(e, data.spec)

      throw e

  appendTestId: (spec, title, id) ->
    normalizedPath = @path.join(@projectRoot, spec)

    @read(normalizedPath).bind(@)
    .then (contents) ->
      @insertId(contents, title, id)
    .then (contents) ->
      ## enable editFileMode which prevents us from sending out test:changed events
      @editFileMode(true)

      ## write the new content back to the file
      @write(normalizedPath, contents)
    .then ->
      ## remove the editFileMode so we emit file changes again
      ## if we're still in edit file mode then wait 1 second and disable it
      ## chokidar doesnt instantly see file changes so we have to wait
      @editFileMode(false, {delay: 1000})
    .catch @hasExistingId, (err) ->
      ## do nothing when the ID is existing

  insertId: (contents, title, id) ->
    re = new RegExp "['\"](" + @escapeRegExp(title) + ")['\"]"

    # ## if the string is found and it doesnt have an id
    matches = re.exec contents

    ## matches[1] will be the captured group which is the title
    return @idFound() if not matches

    ## position is the string index where we first find the capture
    ## group and include its length, so we insert right after it
    position = matches.index + matches[1].length + 1
    @str.insert contents, position, " [#{id}]"

SecretSauce.RemoteProxy =
  okStatus: /^[2|3]\d+$/

  _handle: (req, res, next, Domain, httpProxy) ->
    ## TODO TEST THIS BASEURL FALLBACK
    remoteHost = @getOriginFromFqdnUrl(req) ? req.cookies["__cypress.remoteHost"] ? @app.get("cypress").baseUrl

    ## we must have the remoteHost cookie
    if not remoteHost
      throw new Error("Missing remoteHost!")

    domain = Domain.create()

    domain.on 'error', (err) =>
      @errorHandler(err, req, res, remoteHost)

    domain.run =>
      @getContentStream(req, res, remoteHost, httpProxy)
      .on 'error', (err) =>
        @errorHandler(err, req, res, remoteHost)
      .pipe(res)

  getOriginFromFqdnUrl: (req) ->
    ## if we find an origin from this req.url
    ## then return it, and reset our req.url
    ## after stripping out the origin and ensuring
    ## our req.url starts with only 1 leading slash
    if origin = @UrlHelpers.getOriginFromFqdnUrl(req.url)
      req.url = "/" + req.url.replace(origin, "").replace(/^\/+/, "")

      ## return the origin
      return origin

  getContentStream: (req, res, remoteHost, httpProxy) ->
    switch remoteHost
      ## serve from the file system because
      ## we are using cypress as our weberver
      when "<root>"
        @getFileStream(req, res, remoteHost)

      ## else go make an HTTP request to the
      ## real server!
      else
        @getHttpStream(req, res, remoteHost, httpProxy)

  # creates a read stream to a file stored on the users filesystem
  # taking into account if they've chosen a specific rootFolder
  # that their project files exist in
  getFileStream: (req, res, remoteHost) ->
    { _ } = SecretSauce

    ## strip off any query params from our req's url
    ## since we're pulling this from the file system
    ## it does not understand query params
    pathname = @url.parse(req.url).pathname

    res.contentType(@mime.lookup(pathname))

    args = _.compact([
      @app.get("cypress").projectRoot,
      @app.get("cypress").rootFolder,
      pathname
    ])

    @fs.createReadStream  @path.join(args...)

  getHttpStream: (req, res, remoteHost, httpProxy) ->
    { _ } = SecretSauce

    # write     = res.write
    # writeHead = res.writeHead

    # res.writeHead = (code, headers) ->
    #   console.log "writeHead", code, headers

    #   writeHead.apply(res, arguments)

    # res.write = (data, encoding) ->
    #   console.log "write", data, encoding

    #   write.apply(res, arguments)

    # @emit "verbose", "piping url content #{opts.uri}, #{opts.uri.split(opts.remote)[1]}"
    @Log.info "piping http url content", url: req.url, remoteHost: remoteHost

    selectors = []

    # tr = @trumpet()

    thr = @through

    t = @through (d) -> @queue(d)

    toInject = "
      <script type='text/javascript'>
        window.onerror = function(){
          parent.onerror.apply(parent, arguments);
        }
      </script>
      <script type='text/javascript' src='/__cypress/static/js/sinon.js'></script>
      <script type='text/javascript'>
        var Cypress = parent.Cypress;
        if (!Cypress){
          throw new Error('Cypress must exist in the parent window!');
        };
        Cypress.onBeforeLoad(window);
      </script>
    "

    rewrite = (selector, type, attr, fn) ->
      if _.isFunction(attr)
        fn   = attr
        attr = null

      selectors.push {
        query: selector
        func: (elem) ->
          switch type
            when "attr"
              elem.getAttribute attr, (val) ->
                elem.setAttribute attr, fn(val)
            when "html"
              stream = elem.createStream({outer: true})
              stream.pipe(thr (buf) ->
                @queue fn(buf.toString())
              ).pipe(stream)
      }
      # tr.selectAll selector, (elem) ->
        # elem.getAttribute attr, (val) ->
        #   elem.setAttribute attr, fn(val)

    rewrite "head", "html", (str) ->
      str.replace(/<head>/, "<head> #{toInject}")

    rewrite "[href^='//']", "attr", "href", (href) ->
      "/" + req.protocol + ":" + href

    rewrite "form[action^='//']", "attr", "action", (action) ->
      "/" + req.protocol + ":" + action

    rewrite "form[action^='http']", "attr", "action", (action) ->
      if action.startsWith(remoteHost)
        action.replace(remoteHost, "")
      else
        "/" + action

    rewrite "[href^='http']", "attr", "href", (href) ->
      if href.startsWith(remoteHost)
        href.replace(remoteHost, "")
      else
        "/" + href

    h = @harmon([], selectors, true)

    ## we pass an empty function as next()
    ## because we arent using harmon as middleware
    h(req, res, ->)

    proxy = httpProxy.createProxyServer({})

    # proxy.once "error", (err) =>
    #   if req.cookies["__cypress.initial"] is "true"
    #     @errorHandler err, req, res, remoteHost
    #   else
    #     throw err

    # proxy.once "proxyRes", (proxyRes, req, res) =>
    #   if req.cookies["__cypress.initial"] is "true"
    #     if not @okStatus.test proxyRes.statusCode
    #       @errorHandler null, req, res, remoteHost, proxyRes

    # proxy.once "proxyReq", (proxyReq, req, res) ->

    ## hostRewrite: rewrites location header on redirects back to
    ## ourselves (localhost:2020) so the client will automatically
    ## re-request this back on ourselves so we can proxy it again
    proxy.web(req, res, {
      target: remoteHost
      changeOrigin: true
      autoRewrite: true
    })

    return res#.pipe(t)

  errorHandler: (e, req, res, remoteHost, proxyRes) ->
    remoteHost ?= req.cookies["__cypress.remoteHost"]

    url = @url.resolve(remoteHost, req.url)

    ## disregard ENOENT errors (that means the file wasnt found)
    ## which is a perfectly acceptable error (we account for that)
    if process.env["NODE_ENV"] isnt "production" and e and e.code isnt "ENOENT"
      console.error(e.stack)
      debugger

    @Log.info "error handling request", url: url, error: e

    filePath = switch
      when f = req.formattedUrl
        "file://#{f}"
      else
        url

    ## using req here to give us an opportunity to
    ## write to req.formattedUrl
    htmlPath = @path.join(process.cwd(), "lib/html/initial_500.html")
    # console.log "res status"
    # res.writeHead 501, {
      # "Content-Type": "text/plain"
    # }
    # res.end("DIE!")
    # res.end("WTF!")
    # res.status(501).render(htmlPath, {
      # url: filePath
      # fromFile: !!req.formattedUrl
    # }#, (err, html) ->
    #   proxyRes.writeHead 501, {"Content-Type": "text/html"}
    #   proxyRes.end(html)
    # )
    # res.end()

SecretSauce.RemoteInitial =
  okStatus: /^[2|3|4]\d+$/
  badCookieParam: /^(httponly|secure)$/i

  _handle: (req, res, next, Domain) ->
    { _ } = SecretSauce

    d = Domain.create()

    d.on 'error', (e) => @errorHandler(e, req, res)

    d.run =>
      ## first check to see if this url contains a FQDN
      ## if it does then its been rewritten from an absolute-domain
      ## into a absolute-path-relative link, and we should extract the
      ## remoteHost from this URL
      remoteHost = @getOriginFromFqdnUrl(req) ? req.cookies["__cypress.remoteHost"] ? @app.get("cypress").baseUrl

      @Log.info "handling initial request", url: req.url, remoteHost: remoteHost

      ## we must have the remoteHost which tell us where
      ## we should request the initial HTML payload from
      if not remoteHost
        throw new Error("Missing remoteHost cookie!")

      thr = @through (d) -> @queue(d)

      @getContent(thr, req, res, remoteHost)
        .on "error", (e) => @errorHandler(e, req, res, remoteHost)
        .pipe(res)

  getOriginFromFqdnUrl: (req) ->
    ## if we find an origin from this req.url
    ## then return it, and reset our req.url
    ## after stripping out the origin and ensuring
    ## our req.url starts with only 1 leading slash
    if origin = @UrlHelpers.getOriginFromFqdnUrl(req.url)
      req.url = "/" + req.url.replace(origin, "").replace(/^\/+/, "")

      ## return the origin
      return origin

  getContent: (thr, req, res, remoteHost) ->
    switch remoteHost
      ## serve from the file system because
      ## we are using cypress as our weberver
      when "<root>"
        @getFileContent(thr, req, res, remoteHost)

      ## else go make an HTTP request to the
      ## real server!
      else
        @getHttpContent(thr, req, res, remoteHost)

  getHttpContent: (thr, req, res, remoteHost) ->
    { _ } = SecretSauce

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

    ## prepends req.url with remoteHost
    remoteUrl = @url.resolve(remoteHost, req.url)

    setCookies = (initial, remoteHost) ->
      ## dont set the cookies if we're not on the initial request
      return if req.cookies["__cypress.initial"] isnt "true"

      res.cookie("__cypress.initial", initial)
      res.cookie("__cypress.remoteHost", remoteHost)

    ## we are setting gzip to false here to prevent automatic
    ## decompression of the response since we dont need to transform
    ## it and we can just hand it back to the client. DO NOT BE CONFUSED
    ## our request will still have 'accept-encoding' and therefore
    ## responses WILL be gzipped! Responses will simply not be unzipped!
    opts = {url: remoteUrl, gzip: false, followRedirect: false, strictSSL: false}

    ## do not accept gzip if this is initial
    ## since we have to rewrite html and we dont
    ## want to go through unzipping it, but we may
    ## do this later
    if req.cookies["__cypress.initial"] is "true"
      delete req.headers["accept-encoding"]

    ## rewrite problematic custom headers referencing
    ## the wrong host
    ## we need to use our cookie's remoteHost here and not necessarilly
    ## the remoteUrl
    ## this fixes a bug where we accidentally swapped out referer with the domain of the new url
    ## when it needs to stay as the previous referring remoteHost (from our cookie)
    ## also the host header NEVER includes the protocol so we need to add it here
    req.headers = @mapHeaders(req.headers, req.protocol + "://" + req.get("host"), req.cookies["__cypress.remoteHost"])

    rq = @request(opts)

    rq.on "error", (err) ->
      thr.emit("error", err)

    rq.on "response", (incomingRes) =>
      @setResHeaders(req, res, incomingRes, remoteHost)

      ## always proxy the cookies coming from the incomingRes
      if cookies = incomingRes.headers["set-cookie"]
        res.append("Set-Cookie", @stripCookieParams(cookies))

      if /^30(1|2|7|8)$/.test(incomingRes.statusCode)
        ## redirection is extremely complicated and there are several use-cases
        ## we are encompassing. read the routes_spec for each situation and
        ## why we have to check on so many things.

        ## we go through this merge because the spec states that the location
        ## header may not be a FQDN. If it's not (sometimes its just a /) then
        ## we need to merge in the missing url parts
        newUrl = new @jsUri @UrlHelpers.mergeOrigin(remoteUrl, incomingRes.headers.location)

        ## set cookies to initial=true and our new remoteHost origin
        setCookies(true, newUrl.origin())

        @Log.info "redirecting to new url", status: incomingRes.statusCode, url: newUrl.toString()

        isInitial = req.cookies["__cypress.initial"] is "true"

        ## finally redirect our user agent back to our domain
        ## by making this an absolute-path-relative redirect
        res.redirect @getUrlForRedirect(newUrl, req.cookies["__cypress.remoteHost"], isInitial)
      else
        ## set the status to whatever the incomingRes statusCode is
        res.status(incomingRes.statusCode)

        if not @okStatus.test incomingRes.statusCode
          return @errorHandler(null, req, res, remoteHost)

        @Log.info "received absolute file content"
        # if ct = incomingRes.headers["content-type"]
          # res.contentType(ct)
          # throw new Error("Missing header: 'content-type'")
        # res.contentType(incomingRes.headers['content-type'])

        ## turn off __cypress.initial by setting false here
        setCookies(false, remoteHost)

        if req.cookies["__cypress.initial"] is "true"
          # @rewrite(req, res, remoteHost)
          # res.isHtml = true
          rq.pipe(@rewrite(req, res, remoteHost)).pipe(thr)
        else
          rq.pipe(thr)

    ## proxy the request body, content-type, headers
    ## to the new rq
    req.pipe(rq)

    return thr

  getFileContent: (thr, req, res, remoteHost) ->
    { _ } = SecretSauce

    args = _.compact([
      @app.get("cypress").projectRoot,
      @app.get("cypress").rootFolder,
      req.url
    ])

    ## strip off any query params from our req's url
    ## since we're pulling this from the file system
    ## it does not understand query params
    file = @url.parse(@path.join(args...)).pathname

    req.formattedUrl = file

    @Log.info "getting relative file content", file: file

    ## set the content-type based on the file extension
    res.contentType(@mime.lookup(file))

    res.cookie("__cypress.initial", false)
    res.cookie("__cypress.remoteHost", remoteHost)

    stream = @fs.createReadStream(file, "utf8")

    if req.cookies["__cypress.initial"] is "true"
      stream.pipe(@rewrite(req, res, remoteHost)).pipe(thr)
    else
      stream.pipe(thr)

    return thr

  errorHandler: (e, req, res, remoteHost) ->
    remoteHost ?= req.cookies["__cypress.remoteHost"]

    url = @url.resolve(remoteHost, req.url)

    ## disregard ENOENT errors (that means the file wasnt found)
    ## which is a perfectly acceptable error (we account for that)
    if process.env["NODE_ENV"] isnt "production" and e and e.code isnt "ENOENT"
      console.error(e.stack)
      debugger

    @Log.info "error handling initial request", url: url, error: e

    filePath = switch
      when f = req.formattedUrl
        "file://#{f}"
      else
        url

    ## using req here to give us an opportunity to
    ## write to req.formattedUrl
    htmlPath = @path.join(process.cwd(), "lib/html/initial_500.html")
    res.status(500).render(htmlPath, {
      url: filePath
      fromFile: !!req.formattedUrl
    })

  mapHeaders: (headers, currentHost, remoteHost) ->
    { _ } = SecretSauce

    ## change out custom X-* headers referencing
    ## the wrong host
    hostRe = new RegExp(@escapeRegExp(currentHost), "ig")

    _.mapValues headers, (value, key) ->
      ## if we have a custom header then swap
      ## out any values referencing our currentHost
      ## with the remoteHost
      key = key.toLowerCase()
      if key is "referer" or key is "origin" or key.startsWith("x-")
        value.replace(hostRe, remoteHost)
      else
        ## just return the value
        value

  setResHeaders: (req, res, incomingRes, remoteHost) ->
    { _ } = SecretSauce

    ## omit problematic headers
    headers = _.omit incomingRes.headers, "set-cookie", "x-frame-options", "content-length"

    ## rewrite custom headers which reference the wrong host
    ## if our host is localhost:8080 we need to
    ## rewrite back to our current host localhost:2020
    headers = @mapHeaders(headers, remoteHost, req.get("host"))

    ## proxy the headers
    res.set(headers)

  getUrlForRedirect: (newUrl, remoteHostCookie, isInitial) ->
    ## if isInitial is true, then we're requesting initial content
    ## and we dont care if newUrl and remoteHostCookie matches because
    ## we've already rewritten the remoteHostCookie above
    ##
    ## if the origin of our newUrl matches the current remoteHostCookie
    ## then we're redirecting back to ourselves and we can make
    ## this an absolute-path-relative url to ourselves
    if isInitial or (newUrl.origin() is remoteHostCookie)
      newUrl.toString().replace(newUrl.origin(), "")
    else
      ## if we're not requesting initial content or these
      ## dont match then just prepend with a leading slash
      ## so we retain the remoteHostCookie in the newUrl (like how
      ## our original request came in!)
      "/" + newUrl.toString()

  stripCookieParams: (cookies) ->
    { _ } = SecretSauce

    stripHttpOnlyAndSecure = (cookie) =>
      ## trim out whitespace
      parts = _.invoke cookie.split(";"), "trim"

      ## reject any part that is httponly or secure
      parts = _.reject parts, (part) =>
        @badCookieParam.test(part)

      ## join back up with proper whitespace
      parts.join("; ")

    ## normalize cookies into single dimensional array
     _.map [].concat(cookies), stripHttpOnlyAndSecure

  # rewrite: (req, res, remoteHost) ->
  #   { _ } = SecretSauce

  # write     = res.write
  # writeHead = res.writeHead

  # res.writeHead = (code, headers) ->
  #   console.log "writeHead", code, headers

  #   writeHead.apply(res, arguments)

  # res.write = (data, encoding) ->
  #   console.log "write", data, encoding

  #   write.apply(res, arguments)

  #   through = @through

  #   selectors = []

  #   rewrite = (selector, type, attr, fn) ->
  #     if _.isFunction(attr)
  #       fn   = attr
  #       attr = null

  #     selectors.push {
  #       query: selector
  #       func: (elem) ->
  #         switch type
  #           when "attr"
  #             elem.getAttribute attr, (val) ->
  #               elem.setAttribute attr, fn(val)
  #           when "html"
  #             stream = elem.createStream({outer: true})
  #             stream.pipe(through (buf) ->
  #               @queue fn(buf.toString())
  #             ).pipe(stream)
  #     }

  #   rewrite "head", "html", (str) =>
  #     str.replace("<head>", "<head> #{@getHeadContent()}")

  #   rewrite "[href^='//']", "attr", "href", (href) ->
  #     "/" + req.protocol + ":" + href

  #   rewrite "form[action^='//']", "attr", "action", (action) ->
  #     "/" + req.protocol + ":" + action

  #   rewrite "form[action^='http']", "attr", "action", (action) ->
  #     if action.startsWith(remoteHost)
  #       action.replace(remoteHost, "")
  #     else
  #       "/" + action

  #   rewrite "[href^='http']", "attr", "href", (href) ->
  #     if href.startsWith(remoteHost)
  #       href.replace(remoteHost, "")
  #     else
  #       "/" + href

  #   h = @harmon([], selectors, true)
  #   h(req, res, ->)

  #   # ## for harmon........ ugh
  #   # if ct = res.get("content-type")
  #   #   if ct and ct.includes("text/html")
  #   #     res.isHtml = true

  #   # if ce = res.get("content-encoding")
  #   #   if ce and ce.toLowerCase() is "gzip"
  #   #     res.isGziped = true

  rewrite: (req, res, remoteHost) ->
    { _ } = SecretSauce

    through = @through

    tr = @trumpet()

       # tr.selectAll selector, (elem) ->
        # elem.getAttribute attr, (val) ->
        #   elem.setAttribute attr, fn(val)

    rewrite = (selector, type, attr, fn) ->
      if _.isFunction(attr)
        fn   = attr
        attr = null

      tr.selectAll selector, (elem) ->
        switch type
          when "attr"
            elem.getAttribute attr, (val) ->
              elem.setAttribute attr, fn(val)
          when "html"
            stream = elem.createStream({outer: true})
            stream.pipe(through (buf) ->
              @queue fn(buf.toString())
            ).pipe(stream)

    rewrite "head", "html", (str) =>
      str.replace("<head>", "<head> #{@getHeadContent()}")

    rewrite "[href^='//']", "attr", "href", (href) ->
      "/" + req.protocol + ":" + href

    rewrite "form[action^='//']", "attr", "action", (action) ->
      "/" + req.protocol + ":" + action

    rewrite "form[action^='http']", "attr", "action", (action) ->
      if action.startsWith(remoteHost)
        action.replace(remoteHost, "")
      else
        "/" + action

    rewrite "[href^='http']", "attr", "href", (href) ->
      if href.startsWith(remoteHost)
        href.replace(remoteHost, "")
      else
        "/" + href

    return tr

  getHeadContent: ->
    "
      <script type='text/javascript'>
        window.onerror = function(){
          parent.onerror.apply(parent, arguments);
        }
      </script>
      <script type='text/javascript' src='/__cypress/static/js/sinon.js'></script>
      <script type='text/javascript'>
        var Cypress = parent.Cypress;
        if (!Cypress){
          throw new Error('Cypress must exist in the parent window!');
        };
        Cypress.onBeforeLoad(window);
      </script>
    "

if module?
  module.exports = SecretSauce
else
  SecretSauce
