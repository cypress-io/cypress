/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../spec_helper");

let fs      = require("fs-extra");
const path    = require("path");
const Promise = require("bluebird");
const CA      = require("../../lib/ca");

fs = Promise.promisifyAll(fs);

describe("lib/ca", function() {
  beforeEach(function() {
    this.timeout(5000);

    this.dir = path.join(process.cwd(), "tmp");

    return fs.ensureDirAsync(this.dir)
    .then(() => {
      return CA.create(this.dir);
  }).then(ca => {
      this.ca = ca;
      
    });
  });

  afterEach(function() {
    return fs.removeAsync(this.dir);
  });

  context("#generateServerCertificateKeys", () => it("generates certs for each host", function() {
    return this.ca.generateServerCertificateKeys("www.cypress.io")
    .spread(function(certPem, keyPrivatePem) {
      expect(certPem).to.include("-----BEGIN CERTIFICATE-----");
      return expect(keyPrivatePem).to.include("-----BEGIN RSA PRIVATE KEY-----");
    });
  }));

  return context(".create", function() {
    it("returns a new CA instance", function() {
      return expect(this.ca).to.be.an.instanceof(CA);
    });

    it("creates certs + keys dir", function() {
      return Promise.join(
        fs.statAsync(path.join(this.dir, "certs")),
        fs.statAsync(path.join(this.dir, "keys"))
      );
    });

    it("writes certs/ca.pem", function() {
      return fs.statAsync(path.join(this.dir, "certs", "ca.pem"));
    });

    it("writes keys/ca.private.key", function() {
      return fs.statAsync(path.join(this.dir, "keys", "ca.private.key"));
    });

    it("writes keys/ca.public.key", function() {
      return fs.statAsync(path.join(this.dir, "keys", "ca.public.key"));
    });

    it("sets ca.CAcert", function() {
      return expect(this.ca.CAcert).to.be.an("object");
    });

    it("sets ca.CAkeys", function() {
      expect(this.ca.CAkeys).to.be.an("object");
      expect(this.ca.CAkeys).to.have.a.property("privateKey");
      return expect(this.ca.CAkeys).to.have.a.property("publicKey");
    });

    return describe("existing CA folder", function() {
      beforeEach(function() {
        this.sandbox.spy(CA.prototype, "loadCA");
        this.sandbox.spy(CA.prototype, "generateCA");

        return CA.create(this.dir)
        .then(ca2 => {
          this.ca2 = ca2;
          
      });
      });

      it("calls loadCA and not generateCA", function() {
        expect(CA.prototype.loadCA).to.be.calledOnce;
        return expect(CA.prototype.generateCA).not.to.be.called;
      });

      it("sets ca.CAcert", function() {
        return expect(this.ca2.CAcert).to.be.an("object");
      });

      return it("sets ca.CAkeys", function() {
        expect(this.ca2.CAkeys).to.be.an("object");
        expect(this.ca2.CAkeys).to.have.a.property("privateKey");
        return expect(this.ca2.CAkeys).to.have.a.property("publicKey");
      });
    });
  });
});
