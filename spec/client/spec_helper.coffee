window.expect = chai.expect

before ->
  @sandbox = sinon.sandbox.create()

beforeEach ->
  App.config = App.request "new:config:entity", {}
  App.config.setEnv("ui")

afterEach ->
  @sandbox.restore()

window.loadFixture = (paths, options = {}) ->
  _.defaults options,
    autoResolve: true

  $("iframe").remove()

  ## transform to array even if string
  paths = [].concat(paths)
  paths = _(paths).map (path) -> "/fixtures/" + path + ".html"

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