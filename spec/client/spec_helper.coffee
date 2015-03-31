before ->
  @allowErrors = =>
    @sandbox.stub Cypress.getRunner(), "fail"

  @sandbox = sinon.sandbox.create()

beforeEach ->
  App.config = App.request "new:config:entity", {}
  App.config.setEnv("ui")
  Cypress.Chai.setGlobals(window)

afterEach ->
  @sandbox.restore()

  ## must remove references to the server
  ## and its requests / responses due to sinon bug
  @sandbox.server?.requests = []
  @sandbox.server?.queue = []
  @sandbox.server?.responses = []

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