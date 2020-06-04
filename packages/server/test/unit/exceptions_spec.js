/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../spec_helper");

delete global.fs;

const api           = require(`${root}lib/api`);
const user          = require(`${root}lib/user`);
const logger        = require(`${root}lib/logger`);
const cache         = require(`${root}lib/cache`);
const exception     = require(`${root}lib/exception`);
const Routes        = require(`${root}lib/util/routes`);
const Settings      = require(`${root}lib/util/settings`);
const system        = require(`${root}lib/util/system`);
const pkg           = require("@packages/root");

describe("lib/exceptions", function() {
  context(".getAuthToken", function() {
    it("returns authToken from cache", function() {
      sinon.stub(user, "get").resolves({authToken: "auth-token-123"});

      return exception.getAuthToken().then(authToken => expect(authToken).to.eq("auth-token-123"));
    });

    return it("returns undefined if no authToken", function() {
      sinon.stub(user, "get").resolves({});

      return exception.getAuthToken().then(authToken => expect(authToken).to.be.undinefed);
    });
  });

  context(".getErr", function() {
    it("returns an object literal", function() {
      const err = new Error();
      return expect(exception.getErr(err)).to.have.keys("name", "message", "stack");
    });

    describe("fields", function() {
      beforeEach(function() {
        try {
          return foo.bar();
        } catch (err) {
          return this.err = err;
        }
      });

      it("has name", function() {
        const obj = exception.getErr(this.err);
        return expect(obj.name).to.eq(this.err.name);
      });

      it("has message", function() {
        const obj = exception.getErr(this.err);
        return expect(obj.message).to.eq(this.err.message);
      });

      return it("has stack", function() {
        const obj = exception.getErr(this.err);
        expect(obj.stack).to.be.a("string");
        return expect(obj.stack).to.include("foo is not defined");
      });
    });

    return describe("path stripping", function() {
      beforeEach(function() {
        this.err = {
          name: "Path not found: /Users/ruby/dev/",
          message: "Could not find /Users/ruby/dev/foo.js",
          stack: `\
Error at /Users/ruby/dev/index.js:102
at foo /Users/ruby/dev/foo.js:4
at bar /Users/ruby/dev/bar.js:92\
`
        };
        return this.windowsError = {
          name: "Path not found: \\Users\\ruby\\dev\\",
          message: "Could not find \\Users\\ruby\\dev\\foo.js",
          stack: `\
Error at \\Users\\ruby\\dev\\index.js:102
at foo \\Users\\ruby\\dev\\foo.js:4
at bar \\Users\\ruby\\dev\\bar.js:92\
`
        };});

      it("strips paths from name, leaving file name and line number", function() {
        expect(exception.getErr(this.err).name).to.equal("Path not found: <stripped-path>");
        return expect(exception.getErr(this.windowsError).name).to.equal("Path not found: <stripped-path>");
      });

      it("strips paths from message, leaving file name and line number", function() {
        expect(exception.getErr(this.err).message).to.equal("Could not find <stripped-path>foo.js");
        return expect(exception.getErr(this.windowsError).message).to.equal("Could not find <stripped-path>foo.js");
      });

      it("strips paths from stack, leaving file name and line number", function() {
        expect(exception.getErr(this.err).stack).to.equal(`\
Error at <stripped-path>index.js:102
at foo <stripped-path>foo.js:4
at bar <stripped-path>bar.js:92\
`);
        return expect(exception.getErr(this.windowsError).stack).to.equal(`\
Error at <stripped-path>index.js:102
at foo <stripped-path>foo.js:4
at bar <stripped-path>bar.js:92\
`);
      });

      return it("handles strippable properties being undefined gracefully", () => expect(() => exception.getErr({})).not.to.throw());
    });
  });

  context(".getVersion", () => it("returns version from package.json", function() {
    sinon.stub(pkg, "version").value("0.1.2");
    return expect(exception.getVersion()).to.eq("0.1.2");
  }));

  context(".getBody", function() {
    beforeEach(function() {
      this.err = new Error();
      sinon.stub(pkg, "version").value("0.1.2");
      return sinon.stub(system, "info").resolves({
        system: "info"
      });
    });

    it("sets err", function() {
      return exception.getBody(this.err).then(body => expect(body.err).to.be.an("object"));
    });

    it("sets version", function() {
      return exception.getBody(this.err).then(body => expect(body.version).to.eq("0.1.2"));
    });

    return it("sets system info", function() {
      return exception.getBody(this.err).then(body => expect(body.system).to.eq("info"));
    });
  });

  return context(".create", function() {
    beforeEach(function() {
      this.env = process.env["CYPRESS_INTERNAL_ENV"];
      return sinon.stub(api, "createCrashReport");
    });

    afterEach(function() {
      return process.env["CYPRESS_INTERNAL_ENV"] = this.env;
    });

    describe("with CYPRESS_CRASH_REPORTS=0", function() {
      beforeEach(() => process.env["CYPRESS_CRASH_REPORTS"] = "0");

      afterEach(() => delete process.env["CYPRESS_CRASH_REPORTS"]);

      return it("immediately resolves", () => exception.create()
      .then(() => expect(api.createCrashReport).to.not.be.called));
    });

    describe("development", function() {
      beforeEach(() => process.env["CYPRESS_INTERNAL_ENV"] = "development");

      return it("immediately resolves", () => exception.create()
      .then(() => expect(api.createCrashReport).to.not.be.called));
    });

    return describe("production", function() {
      beforeEach(function() {
        process.env["CYPRESS_INTERNAL_ENV"] = "production";

        this.err = {name: "ReferenceError", message: "undefined is not a function", stack: "asfd"};

        sinon.stub(exception, "getBody").resolves({
          err: this.err,
          version: "0.1.2"
        });

        return sinon.stub(exception, "getAuthToken").resolves("auth-token-123");
      });

      return it("sends body + authToken to api.createCrashReport", function() {
        api.createCrashReport.resolves();

        return exception.create().then(() => {
          const body = {
            err: this.err,
            version: "0.1.2"
          };

          return expect(api.createCrashReport).to.be.calledWith(body, "auth-token-123");
        });
      });
    });
  });
});
