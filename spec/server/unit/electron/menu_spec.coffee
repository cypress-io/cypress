require("../../spec_helper")

_        = require("lodash")
os       = require("os")
electron = require("electron")
menu     = require("#{root}../lib/electron/handlers/menu")

getMenuItem = (label) ->
  _.find(electron.Menu.buildFromTemplate.lastCall.args[0], {label})

getLabels = (menu) ->
  _(menu).map("label").compact().value()

describe "electron/menu", ->
  beforeEach ->
    @sandbox.stub(os, "platform").returns("darwin")
    @sandbox.stub(electron.Menu, "buildFromTemplate")
    @sandbox.stub(electron.Menu, "setApplicationMenu")
    electron.shell.openExternal = @sandbox.stub()

  it "builds menu from template and sets it", ->
    electron.Menu.buildFromTemplate.returns("menu")
    menu.set()

    expect(electron.Menu.buildFromTemplate).to.be.called
    expect(electron.Menu.setApplicationMenu).to.be.calledWith("menu")

  context "Cypress", ->
    describe "on macOS", ->
      it "contains about, services, hide, hide others, show all, quit", ->
        menu.set()
        labels = getLabels(getMenuItem("Cypress").submenu)

        expect(labels).to.eql([
          "About Cypress"
          "Services"
          "Hide Cypress"
          "Hide Others"
          "Show All"
          "Quit"
        ])

      it "sets roles and shortcuts", ->
        menu.set()
        submenu = getMenuItem("Cypress").submenu

        expect(submenu[0].role).to.equal("about")
        expect(submenu[2].role).to.equal("services")
        expect(submenu[4].role).to.equal("hide")
        expect(submenu[4].accelerator).to.equal("Command+H")
        expect(submenu[5].role).to.equal("hideothers")
        expect(submenu[5].accelerator).to.equal("Command+Shift+H")
        expect(submenu[6].role).to.equal("unhide")
        expect(submenu[8].accelerator).to.equal("Command+Q")

      it "exits process when Quit is clicked", ->
        @sandbox.stub(process, "exit")
        menu.set()
        getMenuItem("Cypress").submenu[8].click()
        expect(process.exit).to.be.calledWith(0)

    describe "other OS", ->
      it "does not exist", ->
        os.platform.returns("linux")
        menu.set()
        expect(getMenuItem("Cypress")).to.be.undefined

  context "File", ->
    it "contains changelog, check for updates, logout, close window", ->
      menu.set()
      labels = getLabels(getMenuItem("File").submenu)

      expect(labels).to.eql([
        "Changelog"
        "Check for Updates"
        "Manage Account"
        "Log Out"
        "Close Window"
      ])

    it "opens changelog when Changelog is clicked", ->
      menu.set()
      getMenuItem("File").submenu[0].click()
      expect(electron.shell.openExternal).to.be.calledWith("https://on.cypress.io/changelog")

    it "calls updates callback when Check for Updates is clicked", ->
      onUpdatesClicked = @sandbox.stub()
      menu.set({onUpdatesClicked})
      getMenuItem("File").submenu[1].click()
      expect(onUpdatesClicked).to.be.called

    it "calls original updates callback when menu is reset without new callback", ->
      onUpdatesClicked = @sandbox.stub()
      menu.set({onUpdatesClicked})
      menu.set()
      getMenuItem("File").submenu[1].click()
      expect(onUpdatesClicked).to.be.called

    it "is noop when Check for Updates is clicked with no callback", ->
      menu.set()
      expect(-> getMenuItem("File").submenu[1].click()).not.to.throw()

    it "opens dashboard when Manage Account is clicked", ->
      menu.set()
      getMenuItem("File").submenu[3].click()
      expect(electron.shell.openExternal).to.be.calledWith("https://on.cypress.io/dashboard")

    it "calls logout callback when Log Out is clicked", ->
      onLogOutClicked = @sandbox.stub()
      menu.set({onLogOutClicked})
      getMenuItem("File").submenu[4].click()
      expect(onLogOutClicked).to.be.called

    it "calls original logout callback when menu is reset without new callback", ->
      onLogOutClicked = @sandbox.stub()
      menu.set({onLogOutClicked})
      menu.set()
      getMenuItem("File").submenu[4].click()
      expect(onLogOutClicked).to.be.called

    it "is noop when Check for Updates is clicked with no callback", ->
      menu.set()
      expect(-> getMenuItem("File").submenu[4].click()).not.to.throw()

    it "binds Close Window to shortcut", ->
      menu.set()
      expect(getMenuItem("File").submenu[6]).to.eql({
        label: "Close Window"
        accelerator: "CmdOrCtrl+W"
        role: "close"
      })

  context "Edit", ->
    it "contains undo, redo, cut, copy, paste, selectall", ->
      menu.set()

      expect(getMenuItem("Edit").submenu).to.eql([
        {
          label: "Undo"
          accelerator: "CmdOrCtrl+Z"
          role: "undo"
        }
        {
          label: "Redo"
          accelerator: "Shift+CmdOrCtrl+Z"
          role: "redo"
        }
        {
          type: "separator"
        }
        {
          label: "Cut"
          accelerator: "CmdOrCtrl+X"
          role: "cut"
        }
        {
          label: "Copy"
          accelerator: "CmdOrCtrl+C"
          role: "copy"
        }
        {
          label: "Paste"
          accelerator: "CmdOrCtrl+V"
          role: "paste"
        }
        {
          label: "Select All"
          accelerator: "CmdOrCtrl+A"
          role: "selectall"
        }
      ])

  context "Window", ->
    it "contains minimize", ->
      menu.set()

      expect(getMenuItem("Window")).to.eql({
        label: "Window"
        role: "window"
        submenu: [
          {
            label: "Minimize"
            accelerator: "CmdOrCtrl+M"
            role: "minimize"
          }
        ]
      })

  context "Help", ->
    it "contains report an issue, docs, chat", ->
      menu.set()
      labels = getLabels(getMenuItem("Help").submenu)

      expect(labels).to.eql([
        "Report an Issue.."
        "Cypress Documentation"
        "Cypress Chat"
      ])

    it "opens new issue when Report an Issue is clicked", ->
      menu.set()
      getMenuItem("Help").submenu[0].click()
      expect(electron.shell.openExternal).to.be.calledWith("https://on.cypress.io/new-issue")

    it "opens docs when Cypress Documentation is clicked", ->
      menu.set()
      getMenuItem("Help").submenu[1].click()
      expect(electron.shell.openExternal).to.be.calledWith("https://on.cypress.io")

    it "opens chat when Cypress Chat is clicked", ->
      menu.set()
      getMenuItem("Help").submenu[2].click()
      expect(electron.shell.openExternal).to.be.calledWith("https://on.cypress.io/chat")

  context "Developer Tools", ->
    it "does not exist by default", ->
      menu.set()
      expect(getMenuItem("Developer Tools")).to.be.undefined

    it "does not exist by when withDevTools is false", ->
      menu.set({withDevTools: false})
      expect(getMenuItem("Developer Tools")).to.be.undefined

    describe "when withDevTools is true", ->
      beforeEach ->
        menu.set({withDevTools: true})
        @devSubmenu = getMenuItem("Developer Tools").submenu

      it "exists and contains reload, toggle", ->
        labels = getLabels(@devSubmenu)

        expect(labels).to.eql([
          "Reload"
          "Toggle Developer Tools"
        ])

      it "sets shortcut for Reload", ->
        expect(@devSubmenu[0].accelerator).to.equal("CmdOrCtrl+R")

      it "reloads focused window when Reload is clicked", ->
        reload = @sandbox.stub()
        @devSubmenu[0].click(null, {reload})
        expect(reload).to.be.called

      it "is noop if no focused window when Reload is clicked", ->
        expect(=> @devSubmenu[0].click()).not.to.throw()

      it "sets shortcut for Toggle Developer Tools when macOS", ->
        expect(@devSubmenu[1].accelerator).to.equal("Alt+Command+I")

      it "sets shortcut for Toggle Developer Tools when not macOS", ->
        os.platform.returns("linux")
        menu.set({withDevTools: true})
        expect(getMenuItem("Developer Tools").submenu[1].accelerator).to.equal("Ctrl+Shift+I")

      it "toggles dev tools on focused window when Toggle Developer Tools is clicked", ->
        toggleDevTools = @sandbox.stub()
        @devSubmenu[1].click(null, {toggleDevTools})
        expect(toggleDevTools).to.be.called

      it "is noop if no focused window when Toggle Developer Tools is clicked", ->
        expect(=> @devSubmenu[1].click()).not.to.throw()
