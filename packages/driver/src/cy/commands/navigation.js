_ = require("lodash")
whatIsCircular = require("@cypress/what-is-circular")
moment = require("moment")
UrlParse = require("url-parse")
Promise = require("bluebird")

$utils = require("../../cypress/utils")
$errUtils = require("../../cypress/error_utils")
$Log = require("../../cypress/log")
$Location = require("../../cypress/location")

debug = require('debug')('cypress:driver:navigation')

id                    = null
previousDomainVisited = null
hasVisitedAboutBlank  = null
currentlyVisitingAboutBlank = null
knownCommandCausedInstability = null

REQUEST_URL_OPTS = "auth failOnStatusCode retryOnNetworkFailure retryOnStatusCodeFailure method body headers"
.split(" ")

VISIT_OPTS = "url log onBeforeLoad onLoad timeout requestTimeout"
.split(" ")
.concat(REQUEST_URL_OPTS)

reset = (test = {}) ->
  knownCommandCausedInstability = false

  ## continuously reset this
  ## before each test run!
  previousDomainVisited = false

  ## make sure we reset that we haven't
  ## visited about blank again
  hasVisitedAboutBlank = false

  currentlyVisitingAboutBlank = false

  id = test.id

VALID_VISIT_METHODS = ['GET', 'POST']

isValidVisitMethod = (method) ->
  _.includes(VALID_VISIT_METHODS, method)

timedOutWaitingForPageLoad = (ms, log) ->
  debug('timedOutWaitingForPageLoad')
  $errUtils.throwErrByPath("navigation.timed_out", {
    args: {
      configFile: Cypress.config("configFile")
      ms
    }
    onFail: log
  })

bothUrlsMatchAndRemoteHasHash = (current, remote) ->
  ## the remote has a hash
  ## or the last char of href
  ## is a hash
  (remote.hash or remote.href.slice(-1) is "#") and

    ## both must have the same origin
    (current.origin is remote.origin) and

      ## both must have the same pathname
      (current.pathname is remote.pathname) and

        ## both must have the same query params
        (current.search is remote.search)

cannotVisitDifferentOrigin = (origin, previousUrlVisited, remoteUrl, existingUrl, log) ->
  differences = []

  if remoteUrl.protocol isnt existingUrl.protocol
    differences.push('protocol')
  if remoteUrl.port isnt existingUrl.port
    differences.push('port')
  if remoteUrl.superDomain isnt existingUrl.superDomain
    differences.push('superdomain')

  errOpts = {
    onFail: log
    args: {
      differences: differences.join(', ')
      previousUrl: previousUrlVisited
      attemptedUrl: origin
    }
  }

  $errUtils.throwErrByPath("visit.cannot_visit_different_origin", errOpts)

specifyFileByRelativePath = (url, log) ->
  $errUtils.throwErrByPath("visit.specify_file_by_relative_path", {
    onFail: log
    args: {
      attemptedUrl: url
    }
  })

aboutBlank = (win) ->
  new Promise (resolve) ->
    cy.once("window:load", resolve)

    $utils.locHref("about:blank", win)

navigationChanged = (Cypress, cy, state, source, arg) ->
  ## get the current url of our remote application
  url = cy.getRemoteLocation("href")
  debug('navigation changed:', url)

  ## dont trigger for empty url's or about:blank
  return if _.isEmpty(url) or url is "about:blank"

  ## start storing the history entries
  urls = state("urls") ? []

  previousUrl = _.last(urls)

  ## ensure our new url doesnt match whatever
  ## the previous was. this prevents logging
  ## additionally when the url didnt actually change
  return if url is previousUrl

  ## else notify the world and log this event
  Cypress.action("cy:url:changed", url)

  urls.push(url)

  state("urls", urls)

  state("url", url)

  ## don't output a command log for 'load' or 'before:load' events
  # return if source in command
  return if knownCommandCausedInstability

  ## ensure our new url doesnt match whatever
  ## the previous was. this prevents logging
  ## additionally when the url didnt actually change
  Cypress.log({
    name: "new url"
    message: url
    event: true
    type: "parent"
    end: true
    snapshot: true
    consoleProps: ->
      obj = {
        "New Url": url
      }

      if source
        obj["Url Updated By"] = source

      if arg
        obj.Args = arg

      return obj
  })

formSubmitted = (Cypress, e) ->
  Cypress.log({
    type: "parent"
    name: "form sub"
    message: "--submitting form--"
    event: true
    end: true
    snapshot: true
    consoleProps: -> {
      "Originated From": e.target
      "Args": e
    }
  })

pageLoading = (bool, state) ->
  return if state("pageLoading") is bool

  state("pageLoading", bool)

  Cypress.action("app:page:loading", bool)

stabilityChanged = (Cypress, state, config, stable, event) ->
  debug('stabilityChanged:', stable)
  if currentlyVisitingAboutBlank
    if stable is false
      ## if we're currently visiting about blank
      ## and becoming unstable for the first time
      ## notifiy that we're page loading
      pageLoading(true, state)
      return
    else
      ## else wait until after we finish visiting
      ## about blank
      return

  ## let the world know that the app is page:loading
  pageLoading(!stable, state)

  ## if we aren't becoming unstable
  ## then just return now
  return if stable isnt false

  ## if we purposefully just caused the page to load
  ## (and thus instability) don't log this out
  return if knownCommandCausedInstability

  ## bail if we dont have a runnable
  ## because beforeunload can happen at any time
  ## we may no longer be testing and thus dont
  ## want to fire a new loading event
  ## TODO
  ## this may change in the future since we want
  ## to add debuggability in the chrome console
  ## which at that point we may keep runnable around
  return if not state("runnable")

  options = {}

  _.defaults(options, {
    timeout: config("pageLoadTimeout")
  })

  options._log = Cypress.log({
    type: "parent"
    name: "page load"
    message: "--waiting for new page to load--"
    event: true
    consoleProps: -> {
      Note: "This event initially fires when your application fires its 'beforeunload' event and completes when your application fires its 'load' event after the next page loads."
    }
  })

  cy.clearTimeout("page load")

  onPageLoadErr = (err) ->
    state("onPageLoadErr", null)

    { originPolicy } = $Location.create(window.location.href)

    try
      $errUtils.throwErrByPath("navigation.cross_origin", {
        onFail: options._log
        args: {
          configFile: Cypress.config("configFile")
          message: err.message
          originPolicy: originPolicy
        }
      })
    catch err
      return err

  state("onPageLoadErr", onPageLoadErr)

  loading = ->
    debug('waiting for window:load')
    new Promise (resolve, reject) ->
      cy.once "window:load", ->
        cy.state("onPageLoadErr", null)

        options._log.set("message", "--page loaded--").snapshot().end()

        resolve()

  reject = (err) ->
    if r = state("reject")
      r(err)

  loading()
  .timeout(options.timeout, "page load")
  .catch Promise.TimeoutError, ->
    ## clean this up
    cy.state("onPageLoadErr", null)

    try
      timedOutWaitingForPageLoad(options.timeout, options._log)
    catch err
      reject(err)

normalizeTimeoutOptions = (options) ->
  ## there are really two timeout values - pageLoadTimeout
  ## and the underlying responseTimeout. for the purposes
  ## of resolving resolving the url, we only care about
  ## responseTimeout - since pageLoadTimeout is a driver
  ## and browser concern. therefore we normalize the options
  ## object and send 'responseTimeout' as options.timeout
  ## for the backend.
  _
  .chain(options)
  .pick(REQUEST_URL_OPTS)
  .extend({ timeout: options.responseTimeout })
  .value()

module.exports = (Commands, Cypress, cy, state, config) ->
  reset()

  Cypress.on "test:before:run:async", ->
    ## reset any state on the backend
    Cypress.backend('reset:server:state')

  Cypress.on("test:before:run", reset)

  Cypress.on "stability:changed", (bool, event) ->
    ## only send up page loading events when we're
    ## not stable!
    stabilityChanged(Cypress, state, config, bool, event)

  Cypress.on "navigation:changed", (source, arg) ->
    navigationChanged(Cypress, cy, state, source, arg)

  Cypress.on "form:submitted", (e) ->
    formSubmitted(Cypress, e)

  visitFailedByErr = (err, url, fn) ->
    err.url = url

    Cypress.action("cy:visit:failed", err)

    fn()

  requestUrl = (url, options = {}) ->
    Cypress.backend(
      "resolve:url",
      url,
      normalizeTimeoutOptions(options)
    )
    .then (resp = {}) ->
      switch
        ## if we didn't even get an OK response
        ## then immediately die
        when not resp.isOkStatusCode
          err = new Error
          err.gotResponse = true
          _.extend(err, resp)

          throw err

        when not resp.isHtml
          ## throw invalid contentType error
          err = new Error
          err.invalidContentType = true
          _.extend(err, resp)

          throw err

        else
          resp

  Cypress.on "window:before:load", (contentWindow) ->
    ## TODO: just use a closure here
    current = state("current")

    return if not current

    runnable = state("runnable")

    return if not runnable

    options = _.last(current.get("args"))
    options?.onBeforeLoad?.call(runnable.ctx, contentWindow)

  Commands.addAll({
    reload: (args...) ->
      throwArgsErr = =>
        $errUtils.throwErrByPath("reload.invalid_arguments")

      switch args.length
        when 0
          forceReload = false
          options     = {}

        when 1
          if _.isObject(args[0])
            options = args[0]
          else
            forceReload = args[0]

        when 2
          forceReload = args[0]
          options     = args[1]

        else
          throwArgsErr()

      ## clear the current timeout
      cy.clearTimeout("reload")

      cleanup = null

      reload = ->
        new Promise (resolve, reject) ->
          forceReload ?= false
          options     ?= {}

          _.defaults options, {
            log: true
            timeout: config("pageLoadTimeout")
          }

          if not _.isBoolean(forceReload)
            throwArgsErr()

          if not _.isObject(options)
            throwArgsErr()

          if options.log
            options._log = Cypress.log()

            options._log.snapshot("before", {next: "after"})

          cleanup = ->
            knownCommandCausedInstability = false

            cy.removeListener("window:load", resolve)

          knownCommandCausedInstability = true

          cy.once("window:load", resolve)

          $utils.locReload(forceReload, state("window"))

      reload()
      .timeout(options.timeout, "reload")
      .catch Promise.TimeoutError, (err) ->
        timedOutWaitingForPageLoad(options.timeout, options._log)
      .finally ->
        cleanup?()

        return null

    go: (numberOrString, options = {}) ->
      _.defaults options, {
        log: true
        timeout: config("pageLoadTimeout")
      }

      if options.log
        options._log = Cypress.log()

      win = state("window")

      goNumber = (num) ->
        if num is 0
          $errUtils.throwErrByPath("go.invalid_number", { onFail: options._log })

        cleanup = null

        if options._log
          options._log.snapshot("before", {next: "after"})

        go = ->
          Promise.try ->
            didUnload = false

            beforeUnload = ->
              didUnload = true

            ## clear the current timeout
            cy.clearTimeout()

            cy.once("window:before:unload", beforeUnload)

            didLoad = new Promise (resolve) ->
              cleanup = ->
                cy.removeListener("window:load", resolve)
                cy.removeListener("window:before:unload", beforeUnload)

              cy.once("window:load", resolve)

            knownCommandCausedInstability = true

            win.history.go(num)

            retWin = ->
              ## need to set the attributes of 'go'
              ## consoleProps here with win

              ## make sure we resolve our go function
              ## with the remove window (just like cy.visit)
              state("window")

            Promise
            .delay(100)
            .then ->
              knownCommandCausedInstability = false

              ## if we've didUnload then we know we're
              ## doing a full page refresh and we need
              ## to wait until
              if didUnload
                didLoad.then(retWin)
              else
                retWin()

        go()
        .timeout(options.timeout, "go")
        .catch Promise.TimeoutError, (err) ->
          timedOutWaitingForPageLoad(options.timeout, options._log)
        .finally ->
          cleanup?()

          return null

      goString = (str) ->
        switch str
          when "forward" then goNumber(1)
          when "back"    then goNumber(-1)
          else
            $errUtils.throwErrByPath("go.invalid_direction", {
              onFail: options._log
              args: { str }
            })

      switch
        when _.isFinite(numberOrString) then goNumber(numberOrString)
        when _.isString(numberOrString) then goString(numberOrString)
        else
          $errUtils.throwErrByPath("go.invalid_argument", { onFail: options._log })

    visit: (url, options = {}) ->
      if options.url and url
        $errUtils.throwErrByPath("visit.no_duplicate_url", { args: { optionsUrl: options.url, url: url }})

      if _.isObject(url) and _.isEqual(options, {})
        ## options specified as only argument
        options = url
        url = options.url

      if not _.isString(url)
        $errUtils.throwErrByPath("visit.invalid_1st_arg")

      consoleProps = {}

      if not _.isEmpty(options)
        consoleProps["Options"] = _.pick(options, VISIT_OPTS)

      _.defaults(options, {
        auth: null
        failOnStatusCode: true
        retryOnNetworkFailure: true
        retryOnStatusCodeFailure: false
        method: 'GET'
        body: null
        headers: {}
        log: true
        responseTimeout: config('responseTimeout')
        timeout: config("pageLoadTimeout")
        onBeforeLoad: ->
        onLoad: ->
      })

      if !_.isUndefined(options.qs) and not _.isObject(options.qs)
        $errUtils.throwErrByPath("visit.invalid_qs", { args: { qs: String(options.qs) }})

      if options.retryOnStatusCodeFailure and not options.failOnStatusCode
        $errUtils.throwErrByPath("visit.status_code_flags_invalid")

      if not isValidVisitMethod(options.method)
        $errUtils.throwErrByPath("visit.invalid_method", { args: { method: options.method }})

      if not _.isObject(options.headers)
        $errUtils.throwErrByPath("visit.invalid_headers")

      if _.isObject(options.body) and path = whatIsCircular(options.body)
        $errUtils.throwErrByPath("visit.body_circular", { args: { path }})

      if options.log
        message = url

        if options.method != 'GET'
          message = "#{options.method} #{message}"

        options._log = Cypress.log({
          message: message
          consoleProps: -> consoleProps
        })

      url = $Location.normalize(url)

      if baseUrl = config("baseUrl")
        url = $Location.qualifyWithBaseUrl(baseUrl, url)

      if qs = options.qs
        url = $Location.mergeUrlWithParams(url, qs)

      cleanup = null

      ## clear the current timeout
      cy.clearTimeout("visit")

      win        = state("window")
      $autIframe = state("$autIframe")
      runnable   = state("runnable")

      changeIframeSrc = (url, event) ->
        ## when the remote iframe's load event fires
        ## callback fn
        new Promise (resolve) ->
          ## if we're listening for hashchange
          ## events then change the strategy
          ## to listen to this event emitting
          ## from the window and not cy
          ## see issue 652 for why.
          ## the hashchange events are firing too
          ## fast for us. They even resolve asynchronously
          ## before other application's hashchange events
          ## have even fired.
          if event is "hashchange"
            win.addEventListener("hashchange", resolve)
          else
            cy.once(event, resolve)

          cleanup = ->
            if event is "hashchange"
              win.removeEventListener("hashchange", resolve)
            else
              cy.removeListener(event, resolve)

            knownCommandCausedInstability = false

          knownCommandCausedInstability = true

          $utils.iframeSrc($autIframe, url)

      onLoad = ({runOnLoadCallback, totalTime}) ->
        ## reset window on load
        win = state("window")

        ## the onLoad callback should only be skipped if specified
        if runOnLoadCallback isnt false
          options.onLoad?.call(runnable.ctx, win)

        if options._log
          options._log.set({
            url
            totalTime
          })

        return Promise.resolve(win)

      go = ->
        ## hold onto our existing url
        existing = $utils.locExisting()

        ## TODO: $Location.resolve(existing.origin, url)

        if $Location.isLocalFileUrl(url)
          return specifyFileByRelativePath(url, options._log)

        ## in the case we are visiting a relative url
        ## then prepend the existing origin to it
        ## so we get the right remote url
        if not $Location.isFullyQualifiedUrl(url)
          remoteUrl = $Location.fullyQualifyUrl(url)

        remote = $Location.create(remoteUrl ? url)

        ## reset auth options if we have them
        if a = remote.authObj
          options.auth = a

        ## store the existing hash now since
        ## we'll need to apply it later
        existingHash = remote.hash ? ""
        existingAuth = remote.auth ? ""

        if previousDomainVisited and remote.originPolicy isnt existing.originPolicy
          ## if we've already visited a new superDomain
          ## then die else we'd be in a terrible endless loop
          return cannotVisitDifferentOrigin(remote.origin, previousDomainVisited, remote, existing, options._log)

        current = $Location.create(win.location.href)

        ## if all that is changing is the hash then we know
        ## the browser won't actually make a new http request
        ## for this, and so we need to resolve onLoad immediately
        ## and bypass the actual visit resolution stuff
        if bothUrlsMatchAndRemoteHasHash(current, remote)
          ## https://github.com/cypress-io/cypress/issues/1311
          if current.hash is remote.hash
            consoleProps["Note"] = "Because this visit was to the same hash, the page did not reload and the onBeforeLoad and onLoad callbacks did not fire."

            return onLoad({runOnLoadCallback: false})

          return changeIframeSrc(remote.href, "hashchange")
          .then(onLoad)

        if existingHash
          ## strip out the existing hash if we have one
          ## before telling our backend to resolve this url
          url = url.replace(existingHash, "")

        if existingAuth
          ## strip out the existing url if we have one
          url = url.replace(existingAuth + "@", "")

        requestUrl(url, options)
        .then (resp = {}) =>
          {url, originalUrl, cookies, redirects, filePath} = resp

          ## reapply the existing hash
          url         += existingHash
          originalUrl += existingHash

          if filePath
            consoleProps["File Served"] = filePath
          else
            if url isnt originalUrl
              consoleProps["Original Url"] = originalUrl

          if options.log
            message = options._log.get('message')

            if redirects and redirects.length
              message = [message].concat(redirects).join(" -> ")

            options._log.set({message: message})

          consoleProps["Resolved Url"]  = url
          consoleProps["Redirects"]     = redirects
          consoleProps["Cookies Set"]   = cookies

          remote = $Location.create(url)

          ## if the origin currently matches
          ## then go ahead and change the iframe's src
          ## and we're good to go
          # if origin is existing.origin
          if remote.originPolicy is existing.originPolicy
            previousDomainVisited = remote.origin

            url = $Location.fullyQualifyUrl(url)

            changeIframeSrc(url, "window:load")
            .then ->
              onLoad(resp)
          else
            ## if we've already visited a new origin
            ## then die else we'd be in a terrible endless loop
            if previousDomainVisited
              return cannotVisitDifferentOrigin(remote.origin, previousDomainVisited, remote, existing, options._log)

            ## tell our backend we're changing domains
            ## TODO: add in other things we want to preserve
            ## state for like scrollTop
            s = {
              currentId: id
              tests:     Cypress.getTestsState()
              startTime: Cypress.getStartTime()
              emissions: Cypress.getEmissions()
            }

            s.passed  = Cypress.countByTestState(s.tests, "passed")
            s.failed  = Cypress.countByTestState(s.tests, "failed")
            s.pending = Cypress.countByTestState(s.tests, "pending")
            s.numLogs = $Log.countLogsByTests(s.tests)

            Cypress.action("cy:collect:run:state")
            .then (a = []) ->
              ## merge all the states together holla'
              s = _.reduce a, (memo, obj) ->
                _.extend(memo, obj)
              , s

              Cypress.backend("preserve:run:state", s)
            .then ->
              ## and now we must change the url to be the new
              ## origin but include the test that we're currently on
              newUri = new UrlParse(remote.origin)
              newUri
              .set("pathname", existing.pathname)
              .set("query",    existing.search)
              .set("hash",     existing.hash)

              ## replace is broken in electron so switching
              ## to href for now
              # $utils.locReplace(window, newUri.toString())
              $utils.locHref(newUri.toString(), window)

              ## we are returning a Promise which never resolves
              ## because we're changing top to be a brand new URL
              ## and want to block the rest of our commands
              return Promise.delay(1e9)
        .catch (err) ->
          switch
            when err.gotResponse, err.invalidContentType
              visitFailedByErr err, err.originalUrl, ->
                args = {
                  url:         err.originalUrl
                  path:        err.filePath
                  status:      err.status
                  statusText:  err.statusText
                  redirects:   err.redirects
                  contentType: err.contentType
                }

                msg = switch
                  when err.gotResponse
                    type = if err.filePath then "file" else "http"

                    "visit.loading_#{type}_failed"

                  when err.invalidContentType
                    "visit.loading_invalid_content_type"

                $errUtils.throwErrByPath(msg, {
                  onFail: options._log
                  args: args
                })
            else
              visitFailedByErr err, url, ->
                $errUtils.throwErrByPath("visit.loading_network_failed", {
                  onFail: options._log
                  args: {
                    url:   url
                    error: err
                    stack: err.stack
                  }
                  noStackTrace: true
                })

      visit = ->
        ## if we've visiting for the first time during
        ## a test then we want to first visit about:blank
        ## so that we nuke the previous state. subsequent
        ## visits will not navigate to about:blank so that
        ## our history entries are intact
        if not hasVisitedAboutBlank
          hasVisitedAboutBlank = true
          currentlyVisitingAboutBlank = true

          aboutBlank(win)
          .then ->
            currentlyVisitingAboutBlank = false

            go()
        else
          go()

      visit()
      .timeout(options.timeout, "visit")
      .catch Promise.TimeoutError, (err) =>
        timedOutWaitingForPageLoad(options.timeout, options._log)
      .finally ->
        cleanup?()

        return null
  })
