Promise    = require("bluebird")
chai       = require("chai")
chaiJquery = require("chai-jquery")
nwSpec     = require("../tests/nw_spec.coffee")

moveWindow = (gui, window, left) ->
  screens = gui.Screen.screens

  if screens.length > 1
    ## move the window over to the 2nd screen
    ## and add 20px padding-left
    window.x = screens[1].work_area.x + left

  window.show()

displayRunner = (gui) ->
  runner = gui.Window.get()
  runner.setAlwaysOnTop(true)
  runner.height = 500
  runner.width = 700
  runner.title = "Cypress NW Tests"

  moveWindow(gui, runner, 20)

  return runner

module.exports = (parentWindow, gui) ->
  currentWindow = null

  gui.Screen.Init()
  runner = displayRunner(gui)

  if matches = /--index=(\S+)/.exec gui.App.argv
    pathToIndex = matches[1]
  else
    pathToIndex = "../../nw/public/index.html"

  closeCurrentWindow = ->
    currentWindow.close(true) if currentWindow

  ## when the running is reloading due to UI
  ## close the currentWindow if it exists
  runner.on "loading", closeCurrentWindow

  runner.on "close", ->
    closeCurrentWindow()
    runner.close(true)

  loadIframe = ->
    p = new Promise (resolve, reject) ->
      openWindow = ->
        console.log "pathToIndex", pathToIndex
        currentWindow = gui.Window.open pathToIndex,
          height: 400
          width: 300
          show: false

        currentWindow.once "loaded", ->
          resolve(currentWindow.window)

      if currentWindow
        currentWindow.once "closed", openWindow

        currentWindow.close(true)
      else
        ## else just open up a new window!
        openWindow()

    p.then (win) ->
      left = runner.x + 500
      currentWindow.x = 20
      currentWindow.show()
      currentWindow.showDevTools()
      # moveWindow(gui, currentWindow, left)

      Promise.delay(100).return(win)

  runTests = ->
    {mocha, Mocha} = parentWindow

    ## proxy all of the global mocha functions
    for fn in ["describe", "context", "it", "before", "beforeEach", "afterEach", "after"]
      global[fn] = parentWindow[fn]

    fail = Mocha.Runner::fail
    Mocha.Runner::fail = (test, error) ->
      console.error error.stack
      debugger

      fail.call(@, test, error)

    loadApp = (ctx) ->
      loadIframe().then (contentWindow) ->
        ctx.$   = contentWindow.$
        ctx.App = contentWindow.App

        chai.use (chai, utils) ->
          chaiJquery(chai, utils, ctx.$)

    ## pass our remoteWindow into the spec function
    nwSpec(parentWindow, loadApp)

    ## tell mocha to run since we have now
    ## built our suite / test structure
    mocha.run (failures) ->
      argv = gui.App.argv
      if "--headless" in argv
        process.exit(1)

  runTests()