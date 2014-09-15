window.expect = chai.expect

before ->
  @sandbox = sinon.sandbox.create()

afterEach ->
  @sandbox.restore()

window.loadFixture = (path) ->
  path = "/fixtures/" + path + ".html"

  df = $.Deferred()

  $("iframe").remove()

  iframe = $("<iframe />", {
    src: path
    load: ->
      df.notify @
      df.resolve()
  })

  iframe.appendTo $("body")

  df