require("../../spec_helper")

os       = require("os")
electron = require("electron")
menu     = require("#{root}../lib/electron/handlers/menu")

describe "electron/menu", ->
  beforeEach ->
    @env = process.env["CYPRESS_ENV"]

    process.env["CYPRESS_ENV"] = "production"
    @sandbox.stub(os, "platform").returns("darwin")
    @sandbox.stub(electron.Menu, "buildFromTemplate")
    @sandbox.stub(electron.Menu, "setApplicationMenu")

  afterEach ->
    process.env["CYPRESS_ENV"] = @env

  context ".set", ->
    it "returns if os isnt darwin", ->
      os.platform.returns("linux")

      expect(menu.set()).to.be.undefined
      expect(electron.Menu.buildFromTemplate).not.to.be.called

    it "returns if CYPRESS_ENV isnt production", ->
      process.env["CYPRESS_ENV"] = "development"

      expect(menu.set()).to.be.undefined
      expect(electron.Menu.buildFromTemplate).not.to.be.called

    it "sets undo, rdo, cut, copy, paste, selectall", ->
      electron.Menu.buildFromTemplate.withArgs([
        {
          label: "Edit"
          submenu: [
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
          ]
        }
      ]).returns("the correct menu template!")

      menu.set()

      expect(electron.Menu.setApplicationMenu).to.be.calledWith("the correct menu template!")