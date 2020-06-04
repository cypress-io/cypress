/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../spec_helper");

const style = require("ansi-styles");
const chalk  = require("chalk");
const errors = require(`${root}lib/errors`);
const logger = require(`${root}lib/logger`);
const snapshot = require("snap-shot-it");

describe("lib/errors", function() {
  beforeEach(() => sinon.spy(console, "log"));

  context(".log", function() {
    it("uses red by default", function() {
      const err = errors.get("NOT_LOGGED_IN");

      const ret = errors.log(err);

      expect(ret).to.be.undefined;

      const {
        red
      } = style;

      expect(console.log).to.be.calledWithMatch(red.open);
      return expect(console.log).to.be.calledWithMatch(red.close);
    });

    it("can change the color", function() {
      const err = errors.get("NOT_LOGGED_IN");

      const ret = errors.log(err, "yellow");

      expect(ret).to.be.undefined;

      const {
        yellow
      } = style;

      expect(console.log).to.be.calledWithMatch(yellow.open);
      return expect(console.log).to.be.calledWithMatch(yellow.close);
    });

    it("logs err.message", function() {
      const err = errors.get("NO_PROJECT_ID", "foo/bar/baz");

      const ret = errors.log(err);

      expect(ret).to.be.undefined;

      return expect(console.log).to.be.calledWithMatch("foo/bar/baz");
    });

    it("logs err.details", function() {
      const err = errors.get("PLUGINS_FUNCTION_ERROR", "foo/bar/baz", "details huh");

      const ret = errors.log(err);

      expect(ret).to.be.undefined;

      expect(console.log).to.be.calledWithMatch("foo/bar/baz");
      return expect(console.log).to.be.calledWithMatch("\n", "details huh");
    });

    return it("logs err.stack in development", function() {
      process.env.CYPRESS_INTERNAL_ENV = "development";

      const err = new Error("foo");

      const ret = errors.log(err);

      expect(ret).to.eq(err);

      return expect(console.log).to.be.calledWith(chalk.red(err.stack));
    });
  });

  context(".logException", function() {
    it("calls logger.createException with unknown error", function() {
      sinon.stub(logger, "createException").resolves();
      sinon.stub(process.env, "CYPRESS_INTERNAL_ENV").value("production");

      const err = new Error("foo");

      return errors.logException(err)
      .then(function() {
        expect(console.log).to.be.calledWith(chalk.red(err.stack));
        return expect(logger.createException).to.be.calledWith(err);
      });
    });

    it("does not call logger.createException when known error", function() {
      sinon.stub(logger, "createException").resolves();
      sinon.stub(process.env, "CYPRESS_INTERNAL_ENV").value("production");

      const err = errors.get("NOT_LOGGED_IN");

      return errors.logException(err)
      .then(function() {
        expect(console.log).not.to.be.calledWith(err.stack);
        return expect(logger.createException).not.to.be.called;
      });
    });

    it("does not call logger.createException when not in production env", function() {
      sinon.stub(logger, "createException").resolves();
      sinon.stub(process.env, "CYPRESS_INTERNAL_ENV").value("development");

      const err = new Error("foo");

      return errors.logException(err)
      .then(function() {
        expect(console.log).not.to.be.calledWith(err.stack);
        return expect(logger.createException).not.to.be.called;
      });
    });

    return it("swallows creating exception errors", function() {
      sinon.stub(logger, "createException").rejects(new Error("foo"));
      sinon.stub(process.env, "CYPRESS_INTERNAL_ENV").value("production");

      const err = errors.get("NOT_LOGGED_IN");

      return errors.logException(err)
      .then(ret => expect(ret).to.be.undefined);
    });
  });

  context(".clone", function() {
    it("converts err.message from ansi to html with span classes when html true", function() {
      const err = new Error("foo" + chalk.blue("bar") + chalk.yellow("baz"));
      const obj = errors.clone(err, {html: true});
      return expect(obj.message).to.eq('foo<span class="ansi-blue-fg">bar</span><span class="ansi-yellow-fg">baz</span>');
    });

    return it("does not convert err.message from ansi to html when no html option", function() {
      const err = new Error("foo" + chalk.blue("bar") + chalk.yellow("baz"));
      const obj = errors.clone(err);
      return expect(obj.message).to.eq('foo\u001b[34mbar\u001b[39m\u001b[33mbaz\u001b[39m');
    });
  });

  return context(".displayFlags", () => it("returns string formatted from selected keys", function() {
    const options = {
      tags: "nightly,staging",
      name: "my tests",
      unused: "some other value"
    };
    // we are only interested in showig tags and name values
    // and prepending them with custom prefixes
    const mapping = {
      tags: "--tag",
      name: "--name"
    };
    const text = errors.displayFlags(options, mapping);
    return snapshot("tags and name only", text);
  }));
});
