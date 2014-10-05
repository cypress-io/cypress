window.expect = chai.expect

before ->
  @sandbox = sinon.sandbox.create()

beforeEach ->
  App.execute "set:app:env", "web"

afterEach ->
  @sandbox.restore()

window.loadFixture = (path, options = {}) ->
  _.defaults options,
    autoResolve: true

  path = "/fixtures/" + path + ".html"

  df = $.Deferred()

  $("iframe").remove()

  iframe = $("<iframe />", {
    src: path
    load: ->
      df.notify(@)
      df.resolve(@) if options.autoResolve
  })

  iframe.appendTo $("body")

  df