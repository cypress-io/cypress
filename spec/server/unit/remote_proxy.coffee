RemoteProxy = require("../../../lib/controllers/remote_proxy")
chai        = require('chai')
expect      = chai.expect

chai
.use(require('sinon-chai'))
.should()

describe "remote proxy", ->
  beforeEach ->
    @remoteProxy = new RemoteProxy

  it "throws without a session.remote", ->
    expect(-> @remoteProxy.handle({
      session: {}
    })).to.throw

  it "handles GET's"

  it "Basic Auth"

  context "VERBS", ->

    it "GET"

    it "POST"

    it "PUT"

    it "DELETE"

    it "OPTIONS"

    it "PATCH"

  context "websockets", ->

  context "https", ->

  context "headers", ->

    it "Custom Headers"