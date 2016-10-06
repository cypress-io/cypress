require("../spec_helper")

fs      = require("fs-extra")
path    = require("path")
Promise = require("bluebird")
CA      = require("../../lib/ca")

fs = Promise.promisifyAll(fs)

describe "lib/ca", ->
  beforeEach ->
    @timeout(5000)

    @dir = path.join(process.cwd(), "tmp")

    fs.ensureDirAsync(@dir)
    .then =>
      CA.create(@dir)
    .then (@ca) =>

  afterEach ->
    fs.removeAsync(@dir)

  context "#generateServerCertificateKeys", ->
    it "generates certs for each host", ->
      @ca.generateServerCertificateKeys("www.cypress.io")
      .spread (certPem, keyPrivatePem) ->
        expect(certPem).to.include("-----BEGIN CERTIFICATE-----")
        expect(keyPrivatePem).to.include("-----BEGIN RSA PRIVATE KEY-----")

  context ".create", ->
    it "returns a new CA instance", ->
      expect(@ca).to.be.an.instanceof(CA)

    it "creates certs + keys dir", ->
      Promise.join(
        fs.statAsync(path.join(@dir, "certs"))
        fs.statAsync(path.join(@dir, "keys"))
      )

    it "writes certs/ca.pem", ->
      fs.statAsync(path.join(@dir, "certs", "ca.pem"))

    it "writes keys/ca.private.key", ->
      fs.statAsync(path.join(@dir, "keys", "ca.private.key"))

    it "writes keys/ca.public.key", ->
      fs.statAsync(path.join(@dir, "keys", "ca.public.key"))

    it "sets ca.CAcert", ->
      expect(@ca.CAcert).to.be.an("object")

    it "sets ca.CAkeys", ->
      expect(@ca.CAkeys).to.be.an("object")
      expect(@ca.CAkeys).to.have.a.property("privateKey")
      expect(@ca.CAkeys).to.have.a.property("publicKey")

    describe "existing CA folder", ->
      beforeEach ->
        @sandbox.spy(CA.prototype, "loadCA")
        @sandbox.spy(CA.prototype, "generateCA")

        CA.create(@dir)
        .then (@ca2) =>

      it "calls loadCA and not generateCA", ->
        expect(CA.prototype.loadCA).to.be.calledOnce
        expect(CA.prototype.generateCA).not.to.be.called

      it "sets ca.CAcert", ->
        expect(@ca2.CAcert).to.be.an("object")

      it "sets ca.CAkeys", ->
        expect(@ca2.CAkeys).to.be.an("object")
        expect(@ca2.CAkeys).to.have.a.property("privateKey")
        expect(@ca2.CAkeys).to.have.a.property("publicKey")
