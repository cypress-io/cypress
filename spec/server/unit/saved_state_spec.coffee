require("../spec_helper")

fs = require("fs-extra")
Promise = require("bluebird")
savedState = require("#{root}lib/saved_state")

fs = Promise.promisifyAll(fs)

describe "lib/saved_state", ->

  beforeEach ->
    fs.unlinkAsync(savedState.path)

  context "#set", ->
    it "creates the state.json file if non-existent", ->
      savedState.set({ foo: "foo" }).then ->
        fs.statAsync(savedState.path).catch ->
          throw "state.json file not created"

    it "saves the object as json", ->
      savedState.set({ foo: "foo" })
      .then ->
        fs.readJsonAsync(savedState.path)
      .then (state) ->
        expect(state).to.eql { foo: "foo" }

    it "merges the object with existing state", ->
      savedState.set({ foo: "foo" })
      .then ->
        savedState.set({ bar: "bar", qux: "qux" })
      .then ->
        fs.readJsonAsync(savedState.path)
      .then (state) ->
        expect(state).to.eql {
          bar: "bar"
          foo: "foo"
          qux: "qux"
        }

  context "#get", ->
    beforeEach ->
      savedState.set({
        foo: "foo"
        bar: "bar"
      })

    it "returns the value for the specified key", ->
      savedState.get("foo").then (value) ->
        expect(value).to.equal("foo")

    it "returns all state if no key is specified", ->
      savedState.get().then (state) ->
        expect(state).to.eql {
          bar: "bar"
          foo: "foo"
        }

    it "returns undefined for a non-existent key", ->
      savedState.get("nope").then (value) ->
        expect(value).to.be.undefined

  context ".path", ->
    it "returns the full path to the state.json file", ->
      expect(savedState.path).to.include("cy/test/state.json")
