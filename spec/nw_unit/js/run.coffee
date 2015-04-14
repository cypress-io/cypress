Promise = require("bluebird")
nwSpec  = require("../tests/nw_spec.coffee")

module.exports = (parentWindow, gui) ->

  currentWindow = null

  loadIframe = (parentWindow, gui) ->
    {$} = parentWindow

    ## remove any existing iframes
    # $("iframe").remove()

    currentWindow.close(true) if currentWindow

    new Promise (resolve, reject) ->

      openWindow = ->
        currentWindow = gui.Window.open "../../nw/public/index.html",
          height: 400
          width: 300

        currentWindow.on "loaded", ->
          resolve(currentWindow.window)

      ## if we have a currentWindow then bind to its
      ## closed event and open a new one
      if currentWindow
        currentWindow.on("closed", openWindow)
        currentWindow.close()
      else
        ## else just open up a new window!
        openWindow()

      # iframe = $ "<iframe nwfaketop />",
      #   src: "../../nw/public/index.html",
      #   load: ->
      #     resolve(@contentWindow)
      #     runTests(mocha, parentWindow, @contentWindow)

      # $("body").append(iframe)

  runTests = (parentWindow, gui) ->
    {mocha} = parentWindow

    ## proxy all of the global mocha functions
    for fn in ["describe", "it", "before", "beforeEach", "afterEach", "after"]
      global[fn] = parentWindow[fn]

    loadApp = (ctx) ->
      loadIframe(parentWindow, gui).then (contentWindow) ->
        ctx.$   = contentWindow.$
        ctx.App = contentWindow.App

    ## pass our remoteWindow into the spec function
    nwSpec(parentWindow, loadApp)

    ## tell mocha to run since we have now
    ## built our suite / test structure
    mocha.run()

  runTests(parentWindow, gui)