window.expect = chai.expect

before ->
  @sandbox = sinon.sandbox.create()

beforeEach ->
  App.execute "set:app:env", "web"

afterEach ->
  @sandbox.restore()

window.loadFixture = (path) ->
  path = "/fixtures/" + path + ".html"

  df = $.Deferred()

  $("iframe").remove()

  iframe = $("<iframe />", {
    src: path
    load: ->
      df.resolve(@)
  })

  iframe.appendTo $("body")

  df