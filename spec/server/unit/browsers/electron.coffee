require("../../spec_helper")

electron = require("#{root}../lib/browsers/electron")

describe "lib/browsers/electron", ->
  context "#_setProxy", ->
    it "sets proxy rules for webContents", ->
      webContents = {
        session: {
          setProxy: @sandbox.stub().yieldsAsync()
        }
      }

      electron._setProxy(webContents, "proxy rules")
      .then ->
        expect(webContents.session.setProxy).to.be.calledWith({
          proxyRules: "proxy rules"
        })
