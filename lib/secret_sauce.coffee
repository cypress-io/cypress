_       = require("lodash")
os      = require("os")
cp      = require("child_process")
path    = require("path")
util    = require("util")
kill    = require("tree-kill")
chalk   = require("chalk")
request = require("request-promise")
Promise = require("bluebird")
fs      = require("fs-extra")
git     = require("gift")

fs = Promise.promisifyAll(fs)

log = ->
  msg = util.format.apply(util, arguments)
  process.stdout.write(msg + "\n")

patchGlobalConsoleLog = ->
  if global.console.log isnt log
    global.console.log = log

write = (str) ->
  process.stdout.write(str + "\n")

writeErr = (str, msgs...) ->
  str = [chalk.red(str)].concat(msgs).join(" ")
  write(str)
  process.exit(1)

  ## since we normally stub out exit we need to
  ## throw the str here so our test code's promises
  ## do what they're supposed to do!
  if process.env["CYPRESS_ENV"] isnt "production"
    throw str

SecretSauce =
  mixin: (module, klass) ->
    for key, fn of @[module]
      klass.prototype[key] = fn

SecretSauce.Cli = (App, options, Routes, Chromium, Reporter, Log) ->
  repo = Promise.promisifyAll git(options.projectPath)

  displayToken = (token) ->
    write(token)
    process.exit()

  displayError = (err) ->
    switch
      when err.projectNotFound
        writeErr("Sorry, could not retreive project key because no project was found:", chalk.blue(err.projectPath))
      when err.specNotFound
        writeErr("Sorry, could not run this specific spec because it was not found:", chalk.blue(err.specPath))
      when err.portInUse
        writeErr("Sorry, could not run this project because this port is currently in use:", chalk.blue(err.port), chalk.yellow("\nSpecify a different port with the '--port <port>' argument or shut down the other process using this port."))
      when err.chromiumFailedLoadingCypress
        writeErr("Sorry, there was an error loading Cypress.", chalk.yellow("\nerrorCode:", chalk.blue(err.errorCode)), chalk.yellow("\nerrorDescription:", chalk.blue(err.errorDescription)))
      when err.testsDidNotStart
        writeErr("Sorry, there was an error while attempting to start your tests. The remote client never connected.")
      when err.couldNotSpawnChromium
        writeErr("Sorry, there was an error spawning Chromium.", chalk.yellow("\n" + err.message))
      else
        writeErr("An error occured receiving token.")

  ensureCiEnv = (user) ->
    return true if ensureNoSessionToken(user) and ensureLinuxEnv()

    writeErr("Sorry, running in CI requires a valid CI provider and environment.")

  getBranchFromGit = ->
    repo.branchAsync()
      .get("name")
      .catch -> ""

  getMessage = ->
    repo.current_commitAsync()
      .get("message")
      .catch -> ""

  getAuthor = ->
    repo.current_commitAsync()
      .get("author")
      .get("name")
      .catch -> ""

  getBranch = ->
    for branch in ["CIRCLE_BRANCH", "TRAVIS_BRANCH", "CI_BRANCH"]
      if b = process.env[branch]
        return Promise.resolve(b)

    getBranchFromGit()

  ensureProjectAPIToken = (projectId, key, fn) ->
    Promise.props({
      branch: getBranch()
      author: getAuthor()
      message: getMessage()
    })
    .then (git) ->
      request.post({
        url: Routes.ci(projectId)
        headers: {
          "x-project-token": key
          "x-git-branch":    git.branch
          "x-git-author":    git.author
          "x-git-message":   git.message
        }
        json: true
      })
      .then (attrs) ->
        attrs.ci_guid
      .catch (err) ->
        writeErr("Sorry, your project's API Key: '#{key}' was not valid. This project cannot run in CI.")
    .then(fn)

  ensureLinuxEnv = ->
    return true if os.platform() is "linux"

  ensureNoSessionToken = (user) ->
    ## bail if we DO have a session token
    return true unless user.get("session_token")

  ensureSessionToken = (user) ->
    ## bail if we have a session_token
    return true if user.get("session_token")

    ## else die and log out the auth error
    writeErr("Sorry, you are not currently logged into Cypress. This request requires authentication.\nPlease log into Cypress and then issue this command again.")

  ## think about publicly attaching this class
  ## to the CLI object (in test env) so we can test
  ## it easier without doing NW integration tests
  class Cli
    constructor: (@App, options = {}) ->
      @user = @App.currentUser

      @parseCliOptions(options)

    parseCliOptions: (options) ->
      switch
        when options.logs         then @logs(options)
        when options.clearLogs    then @clearLogs(options)
        when options.ci           then @ci(options)
        when options.getKey       then @getKey(options)
        when options.generateKey  then @generateKey(options)
        # when options.openProject  then @openProject(user, options)
        when options.runProject   then @runProject(options)
        when options.getChromiumVersion then @getChromiumVersion(options)
        else
          @startGuiApp(options)

    getOsPathToChromiumBin: ->
      switch process.platform
        when "darwin" then "./bin/chromium/Chromium.app/Contents/MacOS/Electron"
        when "linux"  then "./bin/chromium/Chromium"

    getChromiumOptions: ->
      opts = {}

      if process.env["CYPRESS_ENV"] is "production"
        opts.cmd = @getOsPathToChromiumBin()
        opts.args = ["--"]
      else
        opts.cmd = "electron"
        opts.cwd = path.join(process.cwd(), "..", "cypress-chromium")
        opts.args = ["."]

      opts

    getChromiumVersion: ->
      opts = @getChromiumOptions()
      opts.stdio = "inherit"
      opts.args.push("--version")

      sp = cp.spawn opts.cmd, opts.args, opts

      sp.on "error", (err) ->
        err.couldNotSpawnChromium = true

        ## log out the error to the console if we're not in production
        if process.env["CYPRESS_ENV"] isnt "production"
          process.stdout.write(JSON.stringify(err) + "\n")

        displayError(err)

      sp.on "close", (code) ->
        process.exit(code)

    clearLogs: ->
      Log.clearLogs().then ->
        process.exit()

    logs: ->
      Log.getLogs().then (logs) ->
        _.each logs, (log, i) ->
          str   = JSON.stringify(log)
          color = if i % 2 is 0 then "cyan" else "yellow"
          write chalk[color](str)

        process.exit()

    getKey: ->
      if ensureSessionToken(@user)

        ## log out the API Token
        @App.config.getProjectToken(@user, options.projectPath)
          .then(displayToken)
          .catch(displayError)

    generateKey: ->
      if ensureSessionToken(@user)

        ## generate a new API Token
        @App.config.generateProjectToken(@user, options.projectPath)
          .then(displayToken)
          .catch(displayError)

    getSrc: (clientUrl, spec) ->
      [clientUrl, "#/tests/", spec, "?__ui=satellite"].join("")

    getSpec: (config, options) ->
      spec = options.spec

      ## if we dont have a specific spec resolve with __all
      return Promise.resolve(@getSrc(config.clientUrl, "__all")) if not spec

      specFile = path.join(options.projectPath, config.testFolder, spec)

      fs.statAsync(specFile)
        .bind(@)
        .then ->
          @getSrc(config.clientUrl, spec)
        .catch (err) ->
          e = new Error
          e.specNotFound = true
          e.specPath = specFile
          throw e

    run: (options) ->
      ## silence all console messages
      @App.silenceConsole()

      id = Math.random()

      reporter = Reporter()

      connected = false
      sp        = null

      killChromium = (fn = ->) ->
        kill sp.pid, "SIGKILL", fn

      p = new Promise (resolve, reject) =>

        @App.vent.trigger "start:projects:app", {
          morgan:      false
          isHeadless:  true
          idGenerator: !options.ci ## if we are in CI dont use IDGenerator
          socketId:    id
          projectPath: options.projectPath
          port:        options.port
          onError:     displayError
          environmentVariables: options.environmentVariables
          # onAppError: (err) ->
            # writeErr(err)

          onResolve: ->
            resolve()

          onConnect: (socketId, socket) ->
            patchGlobalConsoleLog()

            ## if this id is correct and this socket
            ## isnt being tracked yet then add it
            if id is socketId
              if not connected
                ## resolve our promise that we became
                ## connected so it doesnt time out
                @onResolve()
                connected = true

              socket.on "mocha", (event, args...) ->
                args = [event].concat(args)
                reporter.emit.apply(reporter, args)

                if event is "end"
                  stats = reporter.stats()
                  # console.log(stats)

                  killChromium (err) ->
                    process.exit(stats.failures)

          onProjectStart: (config) =>
            @getSpec(config, options)
              .then (src) =>
                patchGlobalConsoleLog()

                console.log("\nTests should begin momentarily...\n")

                o = @getChromiumOptions()
                o.args.push("--url=#{src}")

                sp = cp.spawn o.cmd, o.args, o

                # sp.stdout.on "data", (data) ->
                #   if data.toString() is "did-finish-load"
                #     ## check to ensure there are no App.error
                #     ## if there are exit and log out the error
                #     # process.stdout.write("data is: #{data}")
                #     config.checkForAppErrors()

                ## Chromium will output data on stderr
                ## on 'did-fail-load' events
                sp.stderr.on "data", (data) ->
                  try
                    obj = JSON.parse(data)

                    ## bail if we arent the stderror coming from chromium
                    return if not (obj.hasOwnProperty("errorCode") or obj.hasOwnProperty("errorDescription"))

                    err = new Error
                    err.chromiumFailedLoadingCypress = true
                    err.errorCode = obj.errorCode
                    err.errorDescription = obj.errorDescription

                    displayError(err)

                # @App.execute "start:chromium:run", src, {
                #   headless:    true
                #   onReady: (win) ->
                #     Chromium(win).override({
                #       ci:          options.ci
                #       reporter:    options.reporter
                #       ci_guid:     options.ci_guid
                #     })
                # }
              .catch(displayError)

          onProjectNotFound: (path) ->
            ## instead of throwing we should prompt the user with inquirer
            ## hey this project hasn't ever been added to cypress, would you
            ## like to add this project?
            ## YES/NO
            ## --adding project--
            ## --project added!--

            writeErr("Sorry, could not run project because it was not found:", chalk.blue(path))
        }

      ## allow up to 10 seconds for our promise to resolve
      ## when the client application connects. if we dont
      ## resolve in time then kill all chromium processes
      p
      .timeout(10000)
      .catch Promise.TimeoutError, (err) ->
        err.testsDidNotStart = true

        killChromium ->
          displayError(err)

    runProject: (options) ->
      if ensureSessionToken(@user)
        @run(options)

    removeProject: (options) ->
      ## This project has been removed: path/to/project

    addProject: (projectPath) ->
      ## check if this project is already added
      ## if so, exit with "This project has already been added."
      ## say This project has been successfully added: path/to/project
      @App.config.addProject(projectPath)

    ci: (options) ->
      ## 1. no session
      ## 2. linux env
      ## 3. project API key
      ## 4. TODO travis ci
      ## 5. free/paid project
      {projectPath} = options

      if ensureCiEnv(@user)
        @addProject(projectPath).then =>
          @App.config.getProjectIdByPath(projectPath).then (projectId) =>
            ensureProjectAPIToken projectId, options.key, (ci_guid) =>
              options.ci_guid = ci_guid
              @run(options)

    startGuiApp: (options) ->
      if options.session
        ## if have it, start projects and pass up port + environmentVariables
        @App.vent.trigger "start:projects:app", _.pick(options, "port", "environmentVariables")
      else
        ## else login
        @App.vent.trigger "start:login:app"

      ## display the footer
      @App.vent.trigger "start:footer:app"

      ## display the GUI
      @App.execute "gui:display", options.coords

  new Cli(App, options)

## change this to be a function like CLI
SecretSauce.Chromium =
  override: (options = {}) ->
    { _ } = SecretSauce

    @window.require = require

    @window.$Cypress.isHeadless = true

    ## right now we dont do anything differently
    ## in ci vs a headless run, but when ci is true
    ## we want to record the results of the run
    ## and not do anything if its headless
    # return if options.ci isnt true

    _.extend @window.Mocha.process, process

    @_reporter(@window, options.reporter)
    @_onerror(@window)
    @_log(@window)
    @_afterRun(@window, options.ci_guid)

  _reporter: (window, reporter) ->
    getReporter = ->
      switch
        when reporter is "teamcity"
          require("mocha-teamcity-reporter")

        when reporter?
          try
            require("mocha/lib/reporters/#{reporter}")
          catch
            try
              require(reporter)
            catch
              ## either pass a relative path to your reporter
              ## or include it in your package.json
              writeErr("Could not load reporter:", chalk.blue(reporter))

        else
          require("mocha/lib/reporters/spec")

    window.$Cypress.reporter = getReporter()

  _onerror: (window) ->
    # window.onerror = (err) ->
      # ## log out the error to stdout

      # ## notify Cypress API

      # process.exit(1)

  _log: (window) ->
    util = @util

    window.console.log = ->
      msg = util.format.apply(util, arguments)
      process.stdout.write(msg + "\n")

  _afterRun: (window, ci_guid) ->
    # takeScreenshot = (cb) =>
    #   process.stdout.write("Taking Screenshot\n")
    #   @win.capturePage (img) ->
    #     data = img.replace(/^data:image\/(png|jpg|jpeg);base64,/, "")
    #     fs.writeFile "./ss.jpg", data, "base64", (err) ->
    #       if err
    #         process.stdout.write("err + #{JSON.stringify(err)}")
    #       else
    #         cb()

    window.$Cypress.afterRun = (duration, tests) =>
      # process.stdout.write("Results are:\n")
      # process.stdout.write JSON.stringify(tests)
      # process.stdout.write("\n")
      ## notify Cypress API

      exit = ->
        failures = _.where(tests, {state: "failed"}).length

        # takeScreenshot ->
        process.exit(failures)

      if ci_guid
        request.post({
          url: @Routes.tests(ci_guid)
          body: {
            duration: duration
            tests: tests
          }
          json: true
        })
        .then(exit)
        .catch(exit)
      else
        Promise.try(exit)

SecretSauce.RemoteInitial =
  headRe: /(<head.*?>)/
  htmlRe: /(<html.*?>)/
  okStatus: /^[2|3|4]\d+$/
  badCookieParam: /^(httponly|secure)$/i

  _handle: (req, res, next, Domain) ->
    { _ } = SecretSauce

    ## if we have an unload header it means
    ## our parent app has been navigated away
    ## directly and we need to automatically redirect
    ## to the clientRoute
    if req.cookies["__cypress.unload"]
      return res.redirect @app.get("cypress").clientRoute

    getRemoteHost = (req) =>
      @getOriginFromFqdnUrl(req) ? req.cookies["__cypress.remoteHost"] ? @app.get("cypress").baseUrl ? @app.get("__cypress.remoteHost")

    d = Domain.create()

    d.on 'error', (e) =>
      @errorHandler(e, req, res, getRemoteHost(req))

    d.run =>
      ## 1. first check to see if this url contains a FQDN
      ## if it does then its been rewritten from an absolute-domain
      ## into a absolute-path-relative link, and we should extract the
      ## remoteHost from this URL
      ## 2. or use cookies
      ## 3. or use baseUrl
      ## 4. or finally fall back on app instance var
      remoteHost = getRemoteHost(req)

      @Log.info "handling initial request", url: req.url, remoteHost: remoteHost

      ## we must have the remoteHost which tell us where
      ## we should request the initial HTML payload from
      if not remoteHost
        ## if we dont have a req.session that means we're initially
        ## requesting the cypress app and we need to redirect to the
        ## root path that serves the app
        return res.redirect @app.get("cypress").clientRoute

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

    setCookies = (initial, remoteHost) =>
      ## dont set the cookies if we're not on the initial request
      return if req.cookies["__cypress.initial"] isnt "true"

      res.cookie("__cypress.initial", initial)
      res.cookie("__cypress.remoteHost", remoteHost)
      @app.set("__cypress.remoteHost", remoteHost)

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

      if /^30(1|2|3|7|8)$/.test(incomingRes.statusCode)
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
    @app.set("__cypress.remoteHost", remoteHost)

    stream = @fs.createReadStream(file, "utf8")

    if req.cookies["__cypress.initial"] is "true"
      stream.pipe(@rewrite(req, res, remoteHost)).pipe(thr)
    else
      stream.pipe(thr)

    return thr

  errorHandler: (e, req, res, remoteHost) ->
    url = @url.resolve(remoteHost, req.url)

    ## disregard ENOENT errors (that means the file wasnt found)
    ## which is a perfectly acceptable error (we account for that)
    if process.env["CYPRESS_ENV"] isnt "production" and e and e.code isnt "ENOENT"
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
    headers = _.omit incomingRes.headers, "set-cookie", "x-frame-options", "content-length", "content-security-policy"

    ## rewrite custom headers which reference the wrong host
    ## if our host is localhost:8080 we need to
    ## rewrite back to our current host localhost:2020
    headers = @mapHeaders(headers, remoteHost, req.get("host"))

    ## do not cache the initial responses, no matter what
    ## later on we should switch to an etag system so we dont
    ## have to download the remote http responses if the etag
    ## hasnt changed
    headers["cache-control"] = "no-cache, no-store, must-revalidate"

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

      ## if Domain is included then we actually need to duplicate
      ## the cookie for both the domain and without the domain so
      ## it gets sent for both types of requests...?

      ## reject any part that is httponly or secure
      parts = _.reject parts, (part) =>
        @badCookieParam.test(part)

      ## join back up with proper whitespace
      parts.join("; ")

    ## normalize cookies into single dimensional array
     _.map [].concat(cookies), stripHttpOnlyAndSecure

  rewrite: (req, res, remoteHost) ->
    { _ } = SecretSauce

    through = @through

    tr = @trumpet()

       # tr.selectAll selector, (elem) ->
        # elem.getAttribute attr, (val) ->
        #   elem.setAttribute attr, fn(val)

    changeToAbsoluteRelative = (str) ->
      "/" + req.protocol + ":" + str

    removeRemoteHostOrMakeAbsoluteRelative = (str) ->
      if str.startsWith(remoteHost)
        str.replace(remoteHost, "")
      else
        "/" + str

    rewrite = (selector, type, attr, fn) ->
      options = {}

      switch
        when _.isFunction(attr)
          fn   = attr
          attr = null

        when _.isPlainObject(attr)
          options = attr

      options.method ?= "selectAll"

      tr[options.method] selector, (elem) ->
        switch type
          when "attr"
            elem.getAttribute attr, (val) ->
              elem.setAttribute attr, fn(val)

          when "removeAttr"
            elem.removeAttribute(attr)

          when "html"
            options.outer ?= true
            stream = elem.createStream({outer: options.outer})
            stream.pipe(through (buf) ->
              @queue fn(buf.toString())
            ).pipe(stream)

    ## we still aren't handling pages which are missing their <head> tag
    ## for those we need to insert our own <head> tag
    rewrite "head", "html", (str) =>
      str.replace(@headRe, "$1 #{@getHeadContent()}")

    # rewrite "html", "html", {method: "select"}, (str) =>
    #   ## if we are missing a <head> tag then
    #   ## dynamically insert one
    #   if not @headRe.test(str)
    #     str.replace(@htmlRe, "$1 <head> #{@getHeadContent()} </head>")
    #   else
    #     str

    rewrite "[href^='//']", "attr", "href", changeToAbsoluteRelative

    rewrite "form[action^='//']", "attr", "action", changeToAbsoluteRelative

    rewrite "form[action^='http']", "attr", "action", removeRemoteHostOrMakeAbsoluteRelative

    rewrite "[href^='http']", "attr", "href", removeRemoteHostOrMakeAbsoluteRelative

    ## only rewrite these script src tags if the origin matches our remote host
    ## or matches a domain which we have a cookie for. store a list of domains
    ## per cypress session (to enable parallelization)
    ## __cypress.session
    # rewrite "script[src^='http']", "attr", "src", removeRemoteHostOrMakeAbsoluteRelative
    # rewrite "script[src^='//']", "attr", "src", changeToAbsoluteRelative

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
