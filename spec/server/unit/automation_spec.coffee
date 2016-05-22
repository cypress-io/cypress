require("../spec_helper")

automation = require("#{root}lib/automation")

describe "lib/automation", ->
  beforeEach ->
    @automation = automation("__cypress", "__socket.io")

  context ".pushMessage", ->
    it "calls back with Cookie Removed", ->
      cb = (obj = {}) ->
        expect(obj).to.deep.eq({
          cookie: {name: "foo", value: "bar"}
          message: "Cookie Removed: 'foo=bar'"
          removed: true
        })

      @automation.pushMessage("change:cookie", {removed: true, cookie: {
        name: "foo"
        value: "bar"
        asdf: "jkl"
      }}, cb)

    it "calls back with Cookie Set", ->
      cb = (obj = {}) ->
        expect(obj).to.deep.eq({
          cookie: {name: "foo", value: "bar"}
          message: "Cookie Set: 'foo=bar'"
          removed: false
        })

      @automation.pushMessage("change:cookie", {removed: false, cookie: {
        name: "foo"
        value: "bar"
        asdf: "jkl"
      }}, cb)

    it "is noop when matches cookie namespace", ->
      thrw = ->
        throw new Error("callback should not be called")

      fn = =>
        @automation.pushMessage("change:cookie", {removed: false, cookie: {
          name: "__cypress.initial"
          value: true
          asdf: "jkl"
        }}, thrw)

      expect(fn()).to.be.undefined
      expect(fn()).not.to.throw