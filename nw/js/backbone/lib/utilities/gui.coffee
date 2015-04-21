@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  gui  = require('nw.gui')

  process.argv = process.argv.concat(gui.App.argv)

  windows = {}

  API =
    show: (win) ->
      if App.config.get("debug")
        win.showDevTools() unless win.isDevToolsOpen()
        win.setAlwaysOnTop()

      win.isShown = true
      win.show()

    displayGui: ->
      win = gui.Window.get()

      if not App.config.env("production")
        gui.App.clearCache()
        @show(win)
        @focus(win)

      nativeMenuBar = new gui.Menu(type: "menubar")
      nativeMenuBar.createMacBuiltin "Cypress.io"

      win.menu = nativeMenuBar

      @displayTray(win) unless App.config.env("test")

      win.on "blur", =>
        return if App.fileDialogOpened or not App.config.env("production")

        @hide(win)

      win.on "focus", ->
        ## focus the other windows if they're open
        _.invoke windows, "focus"

    displayTray: (win) ->
      tray = new gui.Tray
        # title:   "Cy"
        icon:    "nw/public/img/tray/mac-normal@2x.png"
        alticon: "nw/public/img/tray/mac-normal-inverse@2x.png"

      ## go this from NW custom tray menu
      iconWidth = 13

      translate = (coords) ->
        coords.x -= Math.floor(win.width / 2 - iconWidth)
        coords.y += 8
        coords

      tray.on "click", (coords) =>
        coords = translate(coords)

        win.moveTo(coords.x, coords.y)

        if win.isShown
          @hide(win)
        else
          @show(win)
          @focus(win)

    hide: (win) ->
      win = gui.Window.get()
      win.isShown = false
      win.hide()

    whitelist: (domain) ->
      gui.App.addOriginAccessWhitelistEntry(domain, 'app', 'app', true)

    focus: (win) ->
      win ?= gui.Window.get()
      win.focus()

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
      try
        gui.App.manifest
      catch
        App.config.getManifest()

    updates: ->
      if updates = windows.updates
        return updates.focus()

      windows.updates = updates = App.request "gui:open", "app://app/nw/public/updates.html",
        position: "center"
        width: 300
        height: 210
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
        App.removeRegion("updatesRegion") if App.updatesRegion

        delete windows.updates

        ## really shut down the window!
        @close(true)

    debug: ->
      if debug = windows.debug
        return debug.focus()

      windows.debug = debug = App.request "gui:open", "app://app/nw/public/debug.html",
        position: "center"
        width: 800
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
        App.removeRegion("debugRegion") if App.debugRegion

        delete windows.debug

        ## really shut down the window!
        @close(true)

    get: ->
      gui.Window.get()

  App.reqres.setHandler "gui:get", ->
    API.get()

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