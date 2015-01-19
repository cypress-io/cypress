@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  gui  = require('nw.gui')

  process.argv = process.argv.concat(gui.App.argv)

  API =
    show: (win) ->
      if App.config.env("dev")
        win.showDevTools() unless win.isDevToolsOpen()
        win.setAlwaysOnTop()

      win.show()

    displayGui: ->
      win = gui.Window.get()

      if App.config.env("dev")
        @show(win)
      else
        win.hide()

      width = win.width

      window.tray = new gui.Tray({ title: 'Cy' })

      tray.on "click", (coords) =>
        win.moveTo(coords.x, coords.y)
        win.moveBy(-(width / 2), 5)

        @show(win)

      win.on "blur", ->
        return if App.fileDialogOpened or App.config.env("dev")

        win.hide()

    whitelist: (domain) ->
      gui.App.addOriginAccessWhitelistEntry(domain, 'app', 'app', true)

    focus: ->
      gui.Window.get().focus()

    open: (url, options) ->
      new gui.Window.open(url, options)

  App.commands.setHandler "gui:display", ->
    API.displayGui()

  App.commands.setHandler "gui:whitelist", (domain) ->
    API.whitelist domain

  App.commands.setHandler "gui:focus", ->
    API.focus()

  App.commands.setHandler "gui:open", (url, options = {}) ->
    API.open(url, options)