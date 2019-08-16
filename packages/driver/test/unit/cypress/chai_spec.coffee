require("../../support/unit_spec_helper")

chai = require("chai")
$Chai = require("#{src}/cy/chai")

describe "src/cypress/chai", ->
  assert = chai.Assertion.prototype.assert

  expectedUnchangedAssertProto = =>
    expect(chai.Assertion.prototype.assert).to.eq(assert)

  beforeEach ->
    @specWindow = {}
    @cy = {
      assert: @sandbox.stub()
    }

    $Chai.create(@specWindow, @cy)

  context ".setSpecWindowGlobals", ->
    it "sets chai, expect, and assert", ->
      expect(@specWindow.chai).not.to.be.undefined
      expect(@specWindow.expect).not.to.be.undefined
      expect(@specWindow.assert).not.to.be.undefined

    it "does not replace assert prototype", ->
      expectedUnchangedAssertProto()

    it "sets a custom expect function", ->
      @specWindow.expect("foo").to.eq("foo")

      expectedUnchangedAssertProto()

      expect(@cy.assert).to.be.calledOnce

    it "can fail an expect assertion", ->
      try
        @specWindow.expect("foo").to.eq("bar")
      catch error
        expect(@cy.assert).to.be.calledOnce
        expectedUnchangedAssertProto()

    it "sets custom assert function", ->
      @specWindow.assert.ok(true, "is true")

      expectedUnchangedAssertProto()

      expect(@cy.assert).to.be.calledOnce

      expectedUnchangedAssertProto()

      @specWindow.assert(1 is 1, "equality")

      expectedUnchangedAssertProto()

      expect(@cy.assert).to.be.calledTwice

      expectedUnchangedAssertProto()

    it "can fail an assert assertion", ->
      try
        @specWindow.assert.ok(false)
      catch error
        expect(@cy.assert).to.be.calledOnce
        expectedUnchangedAssertProto()
