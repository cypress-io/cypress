require("../../support/unit_spec_helper")

$Events = require("#{src}/cypress/events")

describe "src/cypress/events", ->
  beforeEach ->
    @obj = {}

    $Events.extend(@obj)

  context "#on + #emit", ->
    it "invokes callback with args", ->
      stub = @sandbox.stub()

      ret = @obj.on("foo", stub)

      @obj.emit("foo")
      @obj.emit("foo", "bar", "baz")

      expect(ret).to.eq(@obj)
      expect(stub).to.be.calledOn(@obj)
      expect(stub).to.be.calledTwice
      expect(stub.secondCall).to.be.calledWith("bar", "baz")

    it "can bind multiple listeners", ->
      stub1 = @sandbox.stub()
      stub2 = @sandbox.stub()

      @obj.on("foo", stub1)
      @obj.on("foo", stub2)

      @obj.emit("foo")

      expect(stub1).to.be.calledOnce
      expect(stub2).to.be.calledOnce

  context "#once + #emit", ->
    it "invokes callback and then unbinds", ->
      stub = @sandbox.stub()

      ret = @obj.once("foo", stub)

      @obj.emit("foo")
      @obj.emit("foo", "bar", "baz")

      expect(ret).to.eq(@obj)
      expect(stub).to.be.calledOn(@obj)
      expect(stub).to.be.calledOnce
      expect(stub).not.to.be.calledWith("bar", "baz")

  context "#removeAllListeners", ->
    it "removes all listeners", ->
      stub = @sandbox.stub()

      @obj.on("foo", stub)
      @obj.on("bar", stub)

      @obj.removeAllListeners()

      @obj.emit("foo")
      @obj.emit("bar")

      expect(stub).not.to.be.called

    it "removes all listeners of eventName", ->
      stub1 = @sandbox.stub()
      stub2 = @sandbox.stub()
      stub3 = @sandbox.stub()

      @obj.on("foo", stub1)
      @obj.on("foo", stub2)
      @obj.on("bar", stub3)

      @obj.removeAllListeners("foo")

      @obj.emit("foo")
      @obj.emit("bar")

      expect(stub1).not.to.be.called
      expect(stub2).not.to.be.called
      expect(stub3).to.be.called

  context "#removeListener", ->
    it "removes specific listener of eventName with 2 args", ->
      stub1 = @sandbox.stub()
      stub2 = @sandbox.stub()

      @obj.on("foo", stub1)
      @obj.on("foo", stub2)

      @obj.removeListener("foo", stub1)

      @obj.emit("foo")

      expect(stub1).not.to.be.called
      expect(stub2).to.be.called

  context "#emit", ->
    it "returns true if eventName had listeners", ->
      @obj.on "foo", ->

      ret = @obj.emit("foo")

      expect(ret).to.be.true

    it "returns false if eventName had no listeners", ->
      ret = @obj.emit("foo")

      expect(ret).to.be.false

  context "#emitThen", ->
    it "awaits all promises", ->
      stub1 = @sandbox.stub().resolves("foo")
      stub2 = @sandbox.stub().resolves("bar")

      @obj.on("foo", stub1)
      @obj.on("foo", stub2)

      @obj
      .emitThen("foo", "bar", "baz")
      .then (arr) =>
        expect(arr).to.deep.eq(["foo", "bar"])

        expect(stub1).to.be.calledOn(@obj)
        expect(stub1).to.be.calledWith("bar", "baz")

# describe "src/cypress/events", ->
#   beforeEach ->
#     @Cypress = $Cypress.create()
#
#   context ".trigger", ->
#     it "forces ctx to by @cy", (done) ->
#       cy = @Cypress.cy = {}
#       @Cypress.on "foo", ->
#         expect(@).to.eq cy
#         done()
#
#       @Cypress.trigger "foo"
#
#     it "still triggers twice", ->
#       count = 0
#
#       @Cypress.on "foo", ->
#         count += 1
#
#       @Cypress.on "foo", ->
#         count += 1
#
#       @Cypress.trigger("foo")
#       expect(count).to.eq 2
#
#     it "does not throw if there are no _events", ->
#       @Cypress.trigger("foobar")
#
#   context ".event", ->
#     it "gets all callsbacks by name", ->
#       @Cypress.on "foo", fn1 = ->
#       @Cypress.on "foo", fn2 = ->
#
#       events = @Cypress.event("foo")
#       expect(events).to.deep.eq [fn1, fn2]
#
#   context ".invoke", ->
#     it "invokes events by name with arguments", ->
#       args = []
#       ctxs = []
#
#       @Cypress.cy = {}
#
#       @Cypress.on "foo", (arg) ->
#         ctxs.push @
#         args.push arg
#
#       @Cypress.on "foo", (arg) ->
#         ctxs.push @
#         args.push arg
#
#       @Cypress.invoke "foo", "arg1"
#
#       expect(args).to.deep.eq ["arg1", "arg1"]
#       expect(ctxs).to.deep.eq [@Cypress.cy, @Cypress.cy]
