@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  gui  = require('nw.gui')

  process.argv = process.argv.concat(gui.App.argv)

  API =
    show: (win) ->
      if App.config.get("debug")
        win.showDevTools() unless win.isDevToolsOpen()
        win.setAlwaysOnTop()

      win.show()

    displayGui: ->
      win = gui.Window.get()

      if App.config.env("development")
        gui.App.clearCache()
        @show(win)
      else
        win.hide()

      nativeMenuBar = new gui.Menu(type: "menubar")
      nativeMenuBar.createMacBuiltin "Cypress.io"

      win.menu = nativeMenuBar

      tray = new gui.Tray(title: "Cy")

      ## go this from NW custom tray menu
      iconWidth = 13

      translate = (coords) ->
        coords.x -= Math.floor(win.width / 2 - iconWidth)
        coords.y += 8
        coords

      tray.on "click", (coords) =>
        coords = translate(coords)

        win.moveTo(coords.x, coords.y)

        @show(win)
        @focus()

      win.on "blur", ->
        return if App.fileDialogOpened or App.config.env("development")

        win.hide()

    whitelist: (domain) ->
      gui.App.addOriginAccessWhitelistEntry(domain, 'app', 'app', true)

    focus: ->
      gui.Window.get().focus()

    open: (url, options) ->
      new gui.Window.open(url, options)

    reload: ->
      gui.Window.get().reloadDev()

    console: ->
      gui.Window.get().showDevTools()

    external: (url) ->
      gui.Shell.openExternal(url)

    quit: ->
      gui.App.quit()

    manifest: ->
      gui.App.manifest

    updates: ->
      updates = App.request "gui:open", "app://app/nw/public/updates.html",
        position: "center"
        width: 300
        height: 200
        # frame: false
        toolbar: false
        title: ""

      updates.once "loaded", ->
        updates.showDevTools() if App.config.get("debug")

        ## grab the updates region from other window
        $el = $("#updates-region", updates.window.document)

        ## attach to the app as a custom region object
        App.addRegions
          updatesRegion: Marionette.Region.extend(el: $el)

        App.vent.trigger "start:updates:app", App.updatesRegion, updates

      updates.once "close", ->
        ## remove app region when this is closed down
        App.removeRegion("updatesRegion")

        ## really shut down the window!
        @close(true)

    debug: ->
      debug = App.request "gui:open", "app://app/nw/public/debug.html",
        position: "center"
        width: 600
        height: 400
        # frame: false
        toolbar: false
        title: ""

      debug.once "loaded", ->
        debug.showDevTools() if App.config.get("debug")

        ## grab the debug region from other window
        $el = $("#debug-region", debug.window.document)

        ## attach to the app as a custom region object
        App.addRegions
          debugRegion: Marionette.Region.extend(el: $el)

        App.vent.trigger "start:debug:app", App.debugRegion, debug

      debug.once "close", ->
        ## remove app region when this is closed down
        App.removeRegion("debugRegion")

        ## really shut down the window!
        @close(true)

  App.commands.setHandler "gui:display", ->
    API.displayGui()

  App.commands.setHandler "gui:whitelist", (domain) ->
    API.whitelist domain

  App.commands.setHandler "gui:focus", ->
    API.focus()

  App.reqres.setHandler "gui:open", (url, options = {}) ->
    API.open(url, options)

  App.commands.setHandler "gui:reload", ->
    API.reload()

  App.commands.setHandler "gui:console", ->
    API.console()

  App.commands.setHandler "gui:external:open", (url) ->
    API.external(url)

  App.commands.setHandler "gui:quit", ->
    API.quit()

  App.commands.setHandler "gui:check:for:updates", ->
    API.updates()

  App.reqres.setHandler "gui:manifest", ->
    API.manifest()

  App.commands.setHandler "gui:debug", ->
    API.debug()
