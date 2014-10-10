window.expect = chai.expect

before ->
  @sandbox = sinon.sandbox.create()

beforeEach ->
  App.execute "set:app:env", "web"

afterEach ->
  @sandbox.restore()

window.loadFixture = (paths, options = {}) ->
  _.defaults options,
    autoResolve: true

  $("iframe").remove()

  ## transform to array even if string
  paths = Array::concat(paths)
  paths = _(paths).map (path) -> "/fixtures/" + path + ".html"

  dfs = []

  _.each paths, (path, index) ->

    dfs.push $.Deferred()

    iframe = $("<iframe />", {
      src: path
      load: ->
        dfs[index].notify(@)
        dfs[index].resolve(@) if options.autoResolve
    })

    iframe.appendTo $("body")

  $.when(dfs...)