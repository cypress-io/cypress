/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../spec_helper");

const _             = require("lodash");
const os            = require("os");
const http          = require("http");
const express       = require("express");
const Promise       = require("bluebird");
const {
  connect
} = require("@packages/network");
const routes        = require(`${root}lib/routes`);
const config        = require(`${root}lib/config`);
const logger        = require(`${root}lib/logger`);
const Server        = require(`${root}lib/server`);
const Socket        = require(`${root}lib/socket`);
const fileServer    = require(`${root}lib/file_server`);
const ensureUrl     = require(`${root}lib/util/ensure-url`);

const morganFn = function() {};
mockery.registerMock("morgan", () => morganFn);

describe("lib/server", function() {
  beforeEach(function() {
    this.fileServer = {
      close() {},
      port() { return 1111; }
    };
    sinon.stub(fileServer, "create").returns(this.fileServer);

    return config.set({projectRoot: "/foo/bar/"})
    .then(cfg => {
      this.config = cfg;
      this.server = new Server();

      this.oldFileServer = this.server._fileServer;
      return this.server._fileServer = this.fileServer;
    });
  });

  afterEach(function() {
    return this.server && this.server.close();
  });

  context("#createExpressApp", function() {
    beforeEach(function() {
      return this.use = sinon.spy(express.application, "use");
    });

    it("instantiates express instance without morgan", function() {
      const app = this.server.createExpressApp({ morgan: false });
      expect(app.get("view engine")).to.eq("html");
      return expect(this.use).not.to.be.calledWith(morganFn);
    });

    return it("requires morgan if true", function() {
      this.server.createExpressApp({ morgan: true });
      return expect(this.use).to.be.calledWith(morganFn);
    });
  });

  context("#open", function() {
    beforeEach(function() {
      return sinon.stub(this.server, "createServer").resolves();
    });

    it("calls #createExpressApp with morgan", function() {
      sinon.spy(this.server, "createExpressApp");

      _.extend(this.config, {port: 54321, morgan: false});

      return this.server.open(this.config)
      .then(() => {
        return expect(this.server.createExpressApp).to.be.calledWithMatch({ morgan: false });
      });
    });

    it("calls #createServer with port", function() {
      _.extend(this.config, {port: 54321});

      const obj = {};

      sinon.stub(this.server, "createRoutes");
      sinon.stub(this.server, "createExpressApp").returns(obj);

      return this.server.open(this.config)
      .then(() => {
        return expect(this.server.createServer).to.be.calledWith(obj, this.config);
      });
    });

    it("calls #createRoutes with app + config", function() {
      const app = {};
      const project = {};
      const onError = sinon.spy();
      sinon.stub(this.server, "createRoutes");
      sinon.stub(this.server, "createExpressApp").returns(app);

      return this.server.open(this.config, project, onError)
      .then(() => {
        expect(this.server.createRoutes).to.be.called;
        expect(this.server.createRoutes.lastCall.args[0].app).to.equal(app);
        expect(this.server.createRoutes.lastCall.args[0].config).to.equal(this.config);
        expect(this.server.createRoutes.lastCall.args[0].project).to.equal(project);
        return expect(this.server.createRoutes.lastCall.args[0].onError).to.equal(onError);
      });
    });

    it("calls #createServer with port + fileServerFolder + socketIoRoute + app", function() {
      const obj = {};

      sinon.stub(this.server, "createRoutes");
      sinon.stub(this.server, "createExpressApp").returns(obj);

      return this.server.open(this.config)
      .then(() => {
        return expect(this.server.createServer).to.be.calledWith(obj, this.config);
      });
    });

    return it("calls logger.setSettings with config", function() {
      sinon.spy(logger, "setSettings");

      return this.server.open(this.config)
      .then(ret => {
        return expect(logger.setSettings).to.be.calledWith(this.config);
      });
    });
  });

  context("#createServer", function() {
    beforeEach(function() {
      this.port = 54321;
      return this.app  = this.server.createExpressApp({ morgan: true });
    });

    it("isListening=true", function() {
      return this.server.createServer(this.app, {port: this.port})
      .then(() => {
        return expect(this.server.isListening).to.be.true;
      });
    });

    it("resolves with http server port", function() {
      return this.server.createServer(this.app, {port: this.port})
      .spread(port => {
        return expect(port).to.eq(this.port);
      });
    });

    it("all servers listen only on localhost and no other interface", function() {
      fileServer.create.restore();
      this.server._fileServer = this.oldFileServer;

      const interfaces = _.flatten(_.values(os.networkInterfaces()));
      const nonLoopback = interfaces.find(iface => {
        return (iface.family === "IPv4") && (iface.address !== "127.0.0.1");
      });

      //# verify that we can connect to `port` over loopback
      //# and not over another configured IPv4 address
      const tryOnlyLoopbackConnect = port => {
        return Promise.all([
          connect.byPortAndAddress(port, "127.0.0.1"),
          connect.byPortAndAddress(port, nonLoopback)
          .then(function() {
            throw new Error(`Shouldn't be able to connect on ${nonLoopback.address}:${port}`);}).catch({ errno: "ECONNREFUSED" }, function() {})
        ]);
      };

      return this.server.createServer(this.app, {})
      .spread(port => {
        return Promise.map(
          [
            port,
            this.server._fileServer.port(),
            this.server._httpsProxy._sniPort
          ],
          tryOnlyLoopbackConnect
        );
      });
    });

    it("resolves with warning if cannot connect to baseUrl", function() {
      sinon.stub(ensureUrl, "isListening").rejects();
      return this.server.createServer(this.app, {port: this.port, baseUrl: `http://localhost:${this.port}`})
      .spread((port, warning) => {
        expect(warning.type).to.eq("CANNOT_CONNECT_BASE_URL_WARNING");
        return expect(warning.message).to.include(this.port);
      });
    });

    return context("errors", () => it("rejects with portInUse", function() {
      return this.server.createServer(this.app, {port: this.port})
      .then(() => {
        return this.server.createServer(this.app, {port: this.port});
    }).then(function() {
        throw new Error("should have failed but didn't");}).catch(err => {
        expect(err.type).to.eq("PORT_IN_USE_SHORT");
        return expect(err.message).to.include(this.port);
      });
    }));
  });

  context("#end", function() {
    it("calls this._socket.end", function() {
      const socket = sinon.stub({
        end() {},
        close() {}
      });

      this.server._socket = socket;

      this.server.end();
      return expect(socket.end).to.be.called;
    });

    return it("is noop without this._socket", function() {
      return this.server.end();
    });
  });

  context("#startWebsockets", function() {
    beforeEach(function() {
      return this.startListening = sinon.stub(Socket.prototype, "startListening");
    });

    return it("sets _socket and calls _socket#startListening", function() {
      return this.server.open(this.config)
      .then(() => {
        const arg2 = {};
        this.server.startWebsockets(1, 2, arg2);

        return expect(this.startListening).to.be.calledWith(this.server.getHttpServer(), 1, 2, arg2);
      });
    });
  });

  context("#reset", function() {
    beforeEach(function() {
      return this.server.open(this.config)
      .then(() => {
        this.buffers = this.server._networkProxy.http;
        return sinon.stub(this.buffers, "reset");
      });
    });

    it("resets the buffers", function() {
      this.server.reset();
      return expect(this.buffers.reset).to.be.called;
    });

    it("sets the domain to the previous base url if set", function() {
      this.server._baseUrl = "http://localhost:3000";
      this.server.reset();
      return expect(this.server._remoteStrategy).to.equal("http");
    });

    return it("sets the domain to <root> if not set", function() {
      this.server.reset();
      return expect(this.server._remoteStrategy).to.equal("file");
    });
  });

  context("#close", function() {
    it("returns a promise", function() {
      return expect(this.server.close()).to.be.instanceof(Promise);
    });

    it("calls close on this.server", function() {
      return this.server.open(this.config)
      .then(() => {
        return this.server.close();
      });
    });

    it("isListening=false", function() {
      return this.server.open(this.config)
      .then(() => {
        return this.server.close();
    }).then(() => {
        return expect(this.server.isListening).to.be.false;
      });
    });

    it("clears settings from Log", function() {
      logger.setSettings({});

      return this.server.close()
      .then(() => expect(logger.getSettings()).to.be.undefined);
    });

    return it("calls close on this._socket", function() {
      this.server._socket = {close: sinon.spy()};

      return this.server.close()
      .then(() => {
        return expect(this.server._socket.close).to.be.calledOnce;
      });
    });
  });

  context("#proxyWebsockets", function() {
    beforeEach(function() {
      this.proxy  = sinon.stub({
        ws() {},
        on() {}
      });
      this.socket = sinon.stub({end() {}});
      return this.head   = {};});

    it("is noop if req.url startsWith socketIoRoute", function() {
      const socket = {
        remotePort: 12345,
        remoteAddress: '127.0.0.1'
      };

      this.server._socketWhitelist.add({
        localPort: socket.remotePort,
        once: _.noop
      });

      const noop = this.server.proxyWebsockets(this.proxy, "/foo", {
        url: "/foobarbaz",
        socket
      });

      return expect(noop).to.be.undefined;
    });

    it("calls proxy.ws with hostname + port", function() {
      this.server._onDomainSet("https://www.google.com");

      const req = {
        url: "/",
        headers: {
          host: "www.google.com"
        }
      };

      this.server.proxyWebsockets(this.proxy, "/foo", req, this.socket, this.head);

      return expect(this.proxy.ws).to.be.calledWithMatch(req, this.socket, this.head, {
        secure: false,
        target: {
          host: "www.google.com",
          port: "443",
          protocol: "https:"
        }
      });
    });

    return it("ends the socket if its writable and there is no __cypress.remoteHost", function() {
      const req = {
        url: "/",
        headers: {
          cookie: "foo=bar"
        }
      };

      this.server.proxyWebsockets(this.proxy, "/foo", req, this.socket, this.head);
      expect(this.socket.end).not.to.be.called;

      this.socket.writable = true;
      this.server.proxyWebsockets(this.proxy, "/foo", req, this.socket, this.head);
      return expect(this.socket.end).to.be.called;
    });
  });

  return context("#_onDomainSet", function() {
    beforeEach(function() {
      return this.server = new Server();
    });

    it("sets port to 443 when omitted and https:", function() {
      const ret = this.server._onDomainSet("https://staging.google.com/foo/bar");

      return expect(ret).to.deep.eq({
        auth: undefined,
        origin: "https://staging.google.com",
        strategy: "http",
        domainName: "google.com",
        visiting: undefined,
        fileServer: null,
        props: {
          port: "443",
          domain: "google",
          tld: "com"
        }
      });
    });

    it("sets port to 80 when omitted and http:", function() {
      const ret = this.server._onDomainSet("http://staging.google.com/foo/bar");

      return expect(ret).to.deep.eq({
        auth: undefined,
        origin: "http://staging.google.com",
        strategy: "http",
        domainName: "google.com",
        visiting: undefined,
        fileServer: null,
        props: {
          port: "80",
          domain: "google",
          tld: "com"
        }
      });
    });

    it("sets host + port to localhost", function() {
      const ret = this.server._onDomainSet("http://localhost:4200/a/b?q=1#asdf");

      return expect(ret).to.deep.eq({
        auth: undefined,
        origin: "http://localhost:4200",
        strategy: "http",
        domainName: "localhost",
        visiting: undefined,
        fileServer: null,
        props: {
          port: "4200",
          domain: "",
          tld: "localhost"
        }
      });
    });

    return it("sets <root> when not http url", function() {
      this.server._server = {
        address() { return {port: 9999}; }
      };

      this.server._fileServer = {
        port() { return 9998; }
      };

      const ret = this.server._onDomainSet("/index.html");

      return expect(ret).to.deep.eq({
        auth: undefined,
        origin: "http://localhost:9999",
        strategy: "file",
        domainName: "localhost",
        fileServer: "http://localhost:9998",
        props: null,
        visiting: undefined
      });
    });
  });
});
