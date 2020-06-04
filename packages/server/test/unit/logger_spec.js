/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../spec_helper");

const _             = require("lodash");
const path          = require("path");
const Promise       = require("bluebird");
const appData       = require(`${root}lib/util/app_data`);
const konfig        = require(`${root}lib/konfig`);
const logger        = require(`${root}lib/logger`);
const exception     = require(`${root}lib/exception`);

describe("lib/logger", function() {
  beforeEach(() => logger.clearLogs());

  afterEach(() => logger.removeAllListeners("logging"));

  after(() => appData.remove());

  it("has 1 transport", () => expect(logger.transports).to.include.keys("all"));

  it("logs to all", function(done) {
    done = _.once(done);

    logger.on("logging", function(transport, level, msg, data) {
      expect(level).to.eq("info");
      expect(msg).to.eq("foo!");
      expect(data).to.deep.eq({foo: "bar", type: "server"});
      return done();
    });

    return logger.info("foo!", {foo: "bar"});
  });

  describe("#onLog", function() {
    it("calls back with log", function(done) {
      logger.onLog(function(log) {
        expect(log.level).to.eq("info");
        expect(log.message).to.eq("foo");
        expect(log.data).to.deep.eq({foo: "bar"});
        return done();
      });

      return logger.info("foo", {foo: "bar"});
    });

    return it("slices type out of data", function(done) {
      logger.onLog(function(log) {
        expect(log.level).to.eq("info");
        expect(log.message).to.eq("foo");
        expect(log.data).to.deep.eq({foo: "bar"});
        expect(log.type).to.eq("native");
        return done();
      });

      return logger.info("foo", {foo: "bar", type: "native"});
    });
  });

  describe("#getLogs", function() {
    beforeEach(function(done) {
      logger.onLog(log => done());

      return logger.info("foo", {foo: "bar"});
    });

    return it("resolves with logs", () => logger.getLogs("all").then(logs => expect(logs).to.have.length(1)));
  });

  describe("#getData", () => it("nests data object in each log", function() {
    const obj = {level: "info", message: "foo", type: "native", foo: "bar"};

    return expect(logger.getData(obj)).to.deep.eq({
      level: "info",
      message: "foo",
      type: "native",
      data: {
        foo: "bar"
      }
    });
}));

  describe("#exitOnError", () => it("invokes logger.defaultErrorHandler", function() {
    const err = new Error();
    const defaultErrorHandler = sinon.stub(logger, "defaultErrorHandler");
    logger.exitOnError(err);
    return expect(defaultErrorHandler).to.be.calledWith(err);
  }));

  describe("#defaultErrorHandler", function() {
    beforeEach(function() {
      logger.unsetSettings();

      this.err    = new Error();
      this.exit   = sinon.stub(process, "exit");
      return this.create = sinon.stub(exception, "create").resolves();
    });

    afterEach(() => logger.unsetSettings());

    it("calls exception.create(err)", function() {
      logger.defaultErrorHandler(this.err);
      return expect(this.create).to.be.calledWith(this.err, undefined);
    });

    it("calls exception.create(err, {})", function() {
      logger.setSettings({foo: "bar"});
      logger.defaultErrorHandler(this.err);
      return expect(this.create).to.be.calledWith(this.err, {foo: "bar"});
    });

    it("returns false", function() {
      return expect(logger.defaultErrorHandler(this.err)).to.be.false;
    });

    return context("handleErr", function() {
      it("is called after resolving", function() {
        logger.defaultErrorHandler(this.err);
        return Promise.delay(50).then(() => {
          return expect(this.exit).to.be.called;
        });
      });

      it("is called after rejecting", function() {
        this.create.rejects(new Error());
        logger.defaultErrorHandler(this.err);
        return Promise.delay(50).then(() => {
          return expect(this.exit).to.be.called;
        });
      });

      it("calls process.exit(1)", function() {
        logger.defaultErrorHandler(this.err);
        return Promise.delay(50).then(() => {
          return expect(this.exit).to.be.calledWith(1);
        });
      });

      it("calls Log#errorhandler", function() {
        const fn = sinon.spy();
        logger.setErrorHandler(fn);
        logger.defaultErrorHandler(this.err);
        return Promise.delay(50).then(() => {
          return expect(fn).to.be.called;
        });
      });

      return it("calls exit if Log#errorhandler returns true", function() {
        logger.setErrorHandler(() => true);
        logger.defaultErrorHandler(this.err);
        return Promise.delay(50).then(() => {
          return expect(this.exit).to.be.called;
        });
      });
    });
  });

  return describe("unhandledRejection", function() {
    it("passes error to defaultErrorHandler", function() {
      const defaultErrorHandler = sinon.stub(logger, "defaultErrorHandler");

      const handlers = process.listeners("unhandledRejection");

      expect(handlers.length).to.eq(1);

      const err = new Error("foo");

      return handlers[0](err);
    });

    return it("catches unhandled rejections", function() {
      const defaultErrorHandler = sinon.stub(logger, "defaultErrorHandler");

      Promise
        .resolve("")
        .throw(new Error("foo"));

      return Promise.delay(50).then(function() {
        expect(defaultErrorHandler).to.be.calledOnce;
        return expect(defaultErrorHandler.getCall(0).args[0].message).to.eq("foo");
      });
    });
  });
});

      // expect(defaultErrorHandler).to.be.calledWith(err)
  // it "logs to error", (done) ->
  //   # debugger
  //   process.listeners("uncaughtException").pop()
  //   err = (new Error)

  //   logger.on "logging", (transport, level, msg, data) ->
  //     debugger
  //     if transport.name is "error"
  //       expect(level).to.eq("error")
  //       expect(msg).to.eq("err")
  //       expect(data).to.eq(err)
  //       done()

  //   process.on "uncaughtException", (err) ->
  //     debugger

  //   throw err
