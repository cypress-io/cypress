before ->
  $Cypress.Chai.setGlobals(window)

  @allowErrors = (Cypress) ->
    c = Cypress ? @Cypress
    c.off("fail")

  @sandbox = sinon.sandbox.create()

beforeEach ->
  ## allow our own cypress errors to bubble up!
  stubSocketIo.call(@)
  App.config = App.request "new:config:entity", {}
  App.config.setEnv("test")
  App.execute "socket:start"
  App.Utilities.Overrides.overloadMochaRunnerUncaught()

afterEach ->
  @sandbox.restore()

  ## must remove references to the server
  ## and its requests / responses due to sinon bug
  @sandbox.server?.requests = []
  @sandbox.server?.queue = []
  @sandbox.server?.responses = []

stubSocketIo = ->
  window.io =
    connect: @sandbox.spy =>
      on: @sandbox.stub()
      emit: @sandbox.stub()

window.loadDom = (fixture) ->
  loadFixture(fixture).done (iframe) =>
    @iframe = $(iframe)
    @head = @iframe.contents().find("head").children().prop("outerHTML")
    @body = @iframe.contents().find("body").children().prop("outerHTML")

window.getNames = (queue) ->
  _(queue).pluck("name")

window.getFirstSubjectByName = (name) ->
  _(@cy.queue).findWhere({name: name}).subject

window.enterIntegrationTestingMode = (fixture) ->
  before ->
    @loadDom = _.bind(loadDom, @)

  beforeEach ->
    ## load all of the modules
    @Cypress = $Cypress.create({loadModules: true})

    @Cypress.on "fail", (err) ->
      console.error(err.stack)

    @loadDom(fixture).then =>
      @Cypress.initialize @iframe.prop("contentWindow"), @iframe, ->

  after ->
    @iframe.remove()
    @Cypress.stop()

window.enterCommandTestingMode = (fixture = "html/dom") ->
  before ->
    @loadDom = _.bind(loadDom, @)

    @loadDom(fixture)

  beforeEach ->
    @setup = (options = {}) =>
      _.defaults options,
        replaceIframeContents: true

      if options.replaceIframeContents
        @iframe.contents().find("head").html(@head)
        @iframe.contents().find("body").html(@body)

      ## load all of the modules
      @Cypress = $Cypress.create({loadModules: true})

      ## instantiate @cy directly here which simulates
      ## what Cypress.window() does under the hood. we want
      ## to test cy in isolation here away from the Mocha
      ## and Runner and Chai overrides
      @cy = $Cypress.Cy.create(@Cypress, {})

      @Cypress.trigger "initialize",
        $remoteIframe: @iframe
        config: ->

      ## must call defaults manually because
      ## this is naturally called in initialize
      ## AFTER we instantiate our helper classes
      @Cypress.defaults()

      ## set the jquery engine to be our window so we dont have to juggle
      ## the gazillions of edge cases caused by the remote $ elements being
      ## juggled throughout our expectations
      @Cypress.option("jQuery", $)

      @Cypress.set(@currentTest) if @currentTest

      ## handle the fail event ourselves
      ## since we bypass our Runner instance
      @Cypress.on "fail", (err) ->
        console.error(err.stack)

    ## if we've changed the src by navigating
    ## away (aka cy.visit(...)) then we need
    ## to reload the fixture again and then setup
    if /\.html$/.test(@iframe.attr("src"))
      @setup()
    else
      @loadDom(fixture).then @setup

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
    @iframe.remove()
    @Cypress.stop()

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
  paths = _(paths).map (path) -> "/fixtures/" + ext(path)

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