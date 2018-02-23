selectorPlaygroundMethods = require("../../../../src/cypress/selector_playground")

describe "src/cypress/selector_playground", ->
  context ".defaults", ->
    beforeEach ->
      @SelectorPlayground = selectorPlaygroundMethods()

    it "does nothing if not called with selectorPriority or onElement", ->
      @SelectorPlayground.defaults({})
      expect(@SelectorPlayground._selectorPriority()).to.be.undefined
      expect(@SelectorPlayground._onElement()).to.be.undefined

    it "sets selector:playground:priority if selectorPriority specified", ->
      @SelectorPlayground.defaults({
        selectorPriority: ["foo"]
      })
      expect(@SelectorPlayground._selectorPriority()).to.eql(["foo"])

    it "sets selector:playground:on:element if onElement specified", ->
      onElement = ->
      @SelectorPlayground.defaults({ onElement })
      expect(@SelectorPlayground._onElement()).to.equal(onElement)

    it "throws if not passed an object", ->
      expect =>
        @SelectorPlayground.defaults()
      .to.throw("Cypress.SelectorPlayground.defaults() must be called with an object. You passed: ")

    it "throws if selectorPriority is not an array", ->
      expect =>
        @SelectorPlayground.defaults({ selectorPriority: "foo" })
      .to.throw("Cypress.SelectorPlayground.defaults() called with invalid 'selectorPriority' property. It must be an array. You passed: foo")

    it "throws if onElement is not a function", ->
      expect =>
        @SelectorPlayground.defaults({ onElement: "foo" })
      .to.throw("Cypress.SelectorPlayground.defaults() called with invalid 'onElement' property. It must be a function. You passed: foo")
