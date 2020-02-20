/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../spec_helper");

const EE      = require("events");
const Promise = require("bluebird");
const proxy   = require("../helpers/proxy");
const Server  = require("../../lib/server");

describe("lib/server", function() {
  beforeEach(function() {
    return this.setup = (options = {}) => {
      this.ca = {};
      this.port = 12345;

      return Server.create(this.ca, this.port, options);
    };
  });

  afterEach(function() {
    delete process.env.HTTPS_PROXY;
    return delete process.env.NO_PROXY;
  });

  return context("#listen", function() {
    it("calls options.onUpgrade with req, socket head", function() {
      const onUpgrade = this.sandbox.stub();

      return this.setup({onUpgrade})
      .then(function(srv) {
        srv._sniServer.emit("upgrade", 1, 2, 3);

        return expect(onUpgrade).to.be.calledWith(1,2,3);
      });
    });

    it("calls options.onRequest with req, res", function() {
      const onRequest = this.sandbox.stub();
      const req = {url: "https://www.foobar.com", headers: {host: "www.foobar.com"}};
      const res = {};

      return this.setup({onRequest})
      .then(function(srv) {
        srv._sniServer.emit("request", req, res);

        return expect(onRequest).to.be.calledWith(req, res);
      });
    });

    it("calls options.onError with err and port and destroys the client socket", function(done) {
      const socket = new EE();
      socket.destroy = this.sandbox.stub();
      const head = {};

      const onError = function(err, socket2, head2, port) {
        expect(err.message).to.eq("connect ECONNREFUSED 127.0.0.1:8444");

        expect(socket).to.eq(socket2);
        expect(head).to.eq(head2);
        expect(port).to.eq("8444");

        expect(socket.destroy).to.be.calledOnce;

        return done();
      };

      this.setup({ onError })
      .then(function(srv) {
        let conn;
        return conn = srv._makeDirectConnection({url: "localhost:8444"}, socket, head);
      });

    });

    //# https://github.com/cypress-io/cypress/issues/3250
    it("does not crash when an erroneous URL is provided, just destroys socket", function(done) {
      const socket = new EE();
      socket.destroy = this.sandbox.stub();
      const head = {};

      const onError = function(err, socket2, head2, port) {
        expect(err.message).to.eq("connect ECONNREFUSED 127.0.0.1:443");

        expect(socket).to.eq(socket2);
        expect(head).to.eq(head2);
        expect(port).to.eq("443");

        expect(socket.destroy).to.be.calledOnce;

        return done();
      };

      this.setup({ onError })
      .then(function(srv) {
        let conn;
        return conn = srv._makeDirectConnection({url: "%7Balgolia_application_id%7D-dsn.algolia.net:443"}, socket, head);
      });

    });

    return it("with proxied connection calls options.onError with err and port and destroys the client socket", function(done) {
      const socket = new EE();
      socket.destroy = this.sandbox.stub();
      const head = {};

      const onError = function(err, socket2, head2, port) {
        expect(err.message).to.eq("A connection to the upstream proxy could not be established: connect ECONNREFUSED 127.0.0.1:8444");

        expect(socket).to.eq(socket2);
        expect(head).to.eq(head2);
        expect(port).to.eq("11111");

        expect(socket.destroy).to.be.calledOnce;

        return done();
      };

      process.env.HTTPS_PROXY = 'http://localhost:8444';
      process.env.NO_PROXY = '';

      this.setup({ onError })
      .then(function(srv) {
        let conn;
        return conn = srv._makeDirectConnection({url: "should-not-reach.invalid:11111"}, socket, head);
      });

    });
  });
});

