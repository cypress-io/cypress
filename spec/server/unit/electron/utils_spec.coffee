require("../../spec_helper")

electron = require("electron")
electronUtils = require("#{root}../lib/electron/utils")

describe "electron/utils", ->

  context "#setProxy", ->
    it "sets proxy rules through electron's session", ->
      electron.session = {
        defaultSession: {
          setProxy: @sandbox.stub().yieldsAsync()
        }
      }

      electronUtils.setProxy("proxy rules").then ->
        expect(electron.session.defaultSession.setProxy).to.be.calledWith({
          proxyRules: "proxy rules"
        })
