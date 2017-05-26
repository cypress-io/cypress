$Cypress = window.$Cypress
$ = $Cypress.$
_ = $Cypress.prototype._
sinon = $Cypress.prototype.sinon

window.testUtils = {
  $Cypress: $Cypress
  $: $
  _: _
  moment: $Cypress.prototype.moment
  Promise: $Cypress.prototype.Promise
  Cookies: $Cypress.prototype.Cookies
  bililiteRange: $Cypress.prototype.bililiteRange
}

uncaught = Mocha.Runner::uncaught

## create the global for hooks and suites and tests
mocha.setup("bdd")

before ->
  $Cypress.Chai.setGlobals(window)

  @allowErrors = (Cypress) ->
    c = Cypress ? @Cypress
    c.off("fail")

  @assertWindowIsInFocus = (cb) ->
    return cb() if document.hasFocus()

    ct = @test or @currentTest

    if window.env.isCi
      ct.callback(
        new Error("Test requires the browser window be in focus, but it was not")
      )
    else
      ct.skip()

  @sandbox = s = sinon.sandbox.create()
  @sandbox.useFakeTimers = ->
    s.clock = $Cypress.prototype.lolex.install()

beforeEach ->
  ## allow our own cypress errors to bubble up!
  # stubSocketIo.call(@)
  # App.config = App.request "new:config:entity", {}
  # App.config.setEnv("test")
  # App.execute "socket:start"
  Mocha.Runner::uncaught = _.wrap uncaught, (orig, err) ->
    ## debugger if this isnt an AssertionError or CypressError or a message err
    ## because that means we prob f'd up something
    if not /(AssertionError|CypressError)/.test(err.name) and not err.__isMessage and not /SilenceError/.test(err.message)
      console.error(err.stack)
      debugger

    orig.call(@, err)

afterEach ->
  @sandbox.restore()

  @sandbox.clock?.uninstall()

  ## must remove references to the server
  ## and its requests / responses due to sinon bug
  @sandbox.server?.requests = []
  @sandbox.server?.queue = []
  @sandbox.server?.responses = []

resolveUrl = (url, cb) ->
  url = Cypress.Location.resolve(window.location.origin, url)

  cb({
    isOkStatusCode: true
    isHtml: true
    url: url
  })

# stubSocketIo = ->
#   window.io =
#     connect: @sandbox.spy =>
#       on: @sandbox.stub()
#       emit: @sandbox.stub()

window.loadDom = (fixture, options = {}) ->
  loadFixture(fixture).done (iframe) =>
    @$iframe = $(iframe)
    @head = @$iframe.contents().find("head").children().prop("outerHTML")
    @body = @$iframe.contents().find("body").children().prop("outerHTML")
    if options.container
      @$iframe.css(options.container)

window.getNames = (queue) ->
  _.map(queue, "name")

window.getFirstSubjectByName = (name) ->
  @cy.queue.find({name: name}).get("subject")

window.enterAppTestingMode = ->
  beforeEach (done) ->
    iframe = @$iframe ? $("iframe")
    iframe.remove()

    @$iframe = $("<iframe />", {
      style: "position: absolute; right: 0; top: 50px; width: 40%; height: 100%;"
      load: =>
        $mainRegion = $("<div id='main-region'></div>")
        @$iframe.contents().find("body").append $mainRegion
        App.addRegions
          mainRegion: Marionette.Region.extend(el: $mainRegion)

        done()
    })

    @$iframe.appendTo $("body")

  afterEach ->
    @$iframe.remove()

window.enterCommandTestingMode = (fixture = "dom", options = {}) ->
  before ->
    @loadDom = _.bind(loadDom, @)

    @loadDom(fixture, options)

  beforeEach ->
    @setup = (opts = {}) =>
      if options.replaceIframeContents isnt false and opts.replaceIframeContents isnt false
        @$iframe.contents().find("head").html(@head)
        @$iframe.contents().find("body").html(@body)

      # debugger
      # window.mocha.enableTimeouts(false)

      ## load all of the modules
      @Cypress = $Cypress.create()

      @Cypress.runner = {
        getStartTime:      @sandbox.stub()
        getTestsState:     @sandbox.stub()
        countByTestState:  @sandbox.stub()
      }

      ## immediately create the chai instance so
      ## we get our custom properties but then
      ## restore it to keep things simple
      @chai = $Cypress.Chai.create(@Cypress, {})
      @chai.restore()
      @chai.addCustomProperties()

      @Cypress.start()

      ## instantiate @cy directly here which simulates
      ## what Cypress.onSpecWindow() does under the hood. we want
      ## to test cy in isolation here away from the Mocha
      ## and Runner and Chai overrides
      @cy = $Cypress.Cy.create(@Cypress, {})
      $Cypress.Log.create(@Cypress, @cy)
      @Cypress.Commands = $Cypress.Commands.create(@Cypress, @cy)

      @sandbox.stub(@Cypress.cy, "_automateCookies").resolves([])

      ## lets prevent getting a ton of noise
      ## from ending early. we need to do that
      ## in test mode, and this wont affect our
      ## tests around this method (since thats
      ## tested in integration mode)
      @sandbox.stub(@cy, "endedEarlyErr")

      ## in testing we manually call bindWindowListeners
      ## with our iframe's contentWindow because
      ## our iframe has alreadyloaded. because
      ## its already loaded these listeners would
      ## never actually get applied
      @cy.bindWindowListeners @$iframe.prop("contentWindow")

      location = @Cypress.Location.create(window.location.href)

      ct = @currentTest

      @Cypress.setConfig({
        namespace: "__cypress"
        xhrUrl: "__cypress/xhrs/"
        defaultCommandTimeout: 2000
        pageLoadTimeout: 2001
        requestTimeout: 2002
        responseTimeout: 2003
        execTimeout: 2004
        waitForAnimations: true
        animationDistanceThreshold: 5
        remote: {
          origin: location.origin
          domainName: "" ## do not set document.domain!
        }
      })

      @Cypress.trigger "initialize", {$remoteIframe: @$iframe}

      ## must call defaults manually because
      ## this is naturally called in initialize
      ## AFTER we instantiate our helper classes
      # @Cypress.defaults()

      ## set the jquery engine to be our window so we dont have to juggle
      ## the gazillions of edge cases caused by the remote $ elements being
      ## juggled throughout our expectations
      @Cypress.option("jQuery", $)

      if ct
        @Cypress.trigger "test:before:hooks", {id: 123}, {}
        @Cypress.set(ct)
        ct.enableTimeouts(false)

      @Cypress.on("resolve:url", resolveUrl)

      ## handle the fail event ourselves
      ## since we bypass our Runner instance
      @Cypress.on "fail", (err) ->
        console.error(err.stack)
        ## bubble error up to mocha
        if ct
          ct.callback(err)

    ## if we've changed the src by navigating
    ## away (aka cy.visit(...)) then we need
    ## to reload the fixture again and then setup
    fixture = fixture.split(".html").join("") + ".html"

    if _.endsWith(@$iframe.prop("contentWindow").location.href, fixture)
      @setup()
    else
      @loadDom(fixture, options).then @setup

  afterEach ->
    ## we abort here instead of restoring
    ## because we might short circuit some
    ## of our tests and simply dont want
    ## to always properly finish the run.
    ## by aborting we gaurantee our runnable
    ## is nuked, its timeout is cleared, and
    ## we're ready to move on.
    @Cypress.abort()

  after ->
    # @$iframe.remove()
    # @Cypress.stop()

window.Fixtures = do ->
  createRunnables: (obj, suite) ->
    ## create the root suite if we dont have one
    suite = new Mocha.Suite("", new Mocha.Context) if not suite

    _.each obj, (value, key) =>
      switch key
        ## tests are an array
        when "tests"
          @createTests(suite, value)

        when "suites"
          @createSuites(suite, value)

        when "hooks"
          @createHooks(suite, value)

    if arguments.length is 1
      new Mocha.Runner(suite)
    else
      suite

  createHooks: (suite, hooks = []) ->
    _.each hooks, (hook) ->
      suite[hook] ->

  createTests: (suite, tests = []) ->
    _.each tests, (test) ->
      if _.isObject(test)
        name = test.name
        fn = if test.pending then undefined else (->)

        suite.addTest new Mocha.Test(name, fn)
      else
        suite.addTest new Mocha.Test test, ->

  createSuites: (suite, suites = {}) ->
    _.each suites, (obj, suiteName) =>
      newSuite = Mocha.Suite.create suite, suiteName
      @createRunnables(obj, newSuite)

window.loadFixture = (paths, options = {}) ->
  ext = (path) ->
    ## automatically add .html but if path
    ## included an extension it will get sliced off
    (path + ".html").split(".").slice(0, 2).join(".")

  _.defaults options,
    autoResolve: true

  $("iframe").remove()

  ## transform to array even if string
  paths = [].concat(paths)
  paths = _.map paths, (path) -> "/fixtures/" + ext(path)

  dfs = []

  _.each paths, (path, index) ->

    dfs.push $.Deferred()

    iframe = $("<iframe />", {
      src: path
      style: "position: absolute; right: 0; top: 50px; width: 40%; height: 100%;"
      load: ->
        dfs[index].notify(@)
        dfs[index].resolve(@) if options.autoResolve
    })

    iframe.appendTo $("body")

  $.when(dfs...)
