Promise       = require('bluebird')
expect        = require('chai').expect
sinon         = require('sinon')
sinonChai     = require('sinon-chai')
Keys          = require('../../../lib/keys')

describe "key generation", ->
  beforeEach ->
    @keyGen = new Keys
    @appStub =
      get: -> {testFolder: "zap"}

  it "should generate offline file if not present", (done) ->
    sinon.stub @keyGen, '_getOfflineContents', -> Promise.resolve({"start":0,"end":99})
    sinon.stub @keyGen, '_updateOfflineContents', -> Promise.resolve()
    sinon.stub @keyGen, '_initOfflineSync', -> done();

    @keyGen.nextKey(@appStub)

  it "should extract a new key", (done) ->
    sinon.stub @keyGen, '_ensureOfflineCache', -> Promise.resolve()
    sinon.stub @keyGen, '_getOfflineContents', -> Promise.resolve({"start":0,"end":99})
    sinon.stub @keyGen, '_updateOfflineContents', -> Promise.resolve()

    @keyGen.nextKey(@appStub)
    .then (id) ->
      expect(id).to.eql('001')
      done()

  it "should bump the range after a test", (done) ->
    currentRange = {"start":0,"end":99}

    sinon.stub @keyGen, '_ensureOfflineCache', -> Promise.resolve()
    sinon.stub @keyGen, '_getOfflineContents', -> Promise.resolve(currentRange)
    sinon.stub @keyGen, '_updateOfflineContents', (range) -> currentRange = range; Promise.resolve()

    @keyGen.nextKey(@appStub)
    .then ->
      expect(currentRange).to.eql({start:1, end:99})
      done()
