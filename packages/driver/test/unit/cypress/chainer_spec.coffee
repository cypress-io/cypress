require("../../support/unit_spec_helper")

$Chainer = require("#{src}/cypress/chainer")

describe "src/cypress/chainer", ->
  context ".inject", ->
    afterEach ->
      delete $Chainer::foo

    it "sets key/fn on the $Chainer prototype", ->
      $Chainer.inject "foo", ->
      expect($Chainer.prototype.foo).to.be.a("function")

    it "calls the callback with cy context, id, and args", (done) ->
      cy = {state: ->}

      fn = (id, firstCall, args) ->
        expect(@).to.eq cy
        expect(id).to.eq chainer.id
        expect(firstCall).to.be.true
        expect(args).to.deep.eq []
        done()

      $Chainer.inject "foo", fn
      chainer = new $Chainer(cy)
      chainer.foo()

  context ".create", ->

  context "#constructor", ->
    it "sets unique id", ->
      chainer = new $Chainer
      expect(chainer.id).to.be.ok

    it "sets cy", ->
      cy = {}
      chainer = new $Chainer(cy)
      expect(chainer.cy).to.eq cy
