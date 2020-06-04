/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../spec_helper");

const Promise = require("bluebird");
const pkg = require("@packages/root");
const fs = require(`${root}lib/util/fs`);
const mockedEnv = require('mocked-env');
const {
  app
} = require("electron");

const setEnv = env => {
  process.env["CYPRESS_INTERNAL_ENV"] = env;
  return expectedEnv(env);
};

var expectedEnv = function(env) {
  require(`${root}lib/environment`);
  return expect(process.env["CYPRESS_INTERNAL_ENV"]).to.eq(env);
};

const setPkg = env => {
  pkg.env = env;
  return expectedEnv(env);
};

const env = process.env["CYPRESS_INTERNAL_ENV"];

describe("lib/environment", function() {
  beforeEach(function() {
    sinon.stub(Promise, "config");
    delete process.env["CYPRESS_INTERNAL_ENV"];
    return delete require.cache[require.resolve(`${root}lib/environment`)];});

  afterEach(function() {
    delete require.cache[require.resolve(`${root}lib/environment`)];
    return delete process.env["CYPRESS_INTERNAL_ENV"];});

  after(() => process.env["CYPRESS_INTERNAL_ENV"] = env);

  context("parses ELECTRON_EXTRA_LAUNCH_ARGS", function() {
    let restore = null;

    beforeEach(() => restore = mockedEnv({
      ELECTRON_EXTRA_LAUNCH_ARGS: "--foo --bar=baz --quux=true"
    }));

    it("sets launch args", function() {
      sinon.stub(app.commandLine, "appendArgument");
      require(`${root}lib/environment`);
      expect(app.commandLine.appendArgument).to.have.been.calledWith("--foo");
      expect(app.commandLine.appendArgument).to.have.been.calledWith("--bar=baz");
      return expect(app.commandLine.appendArgument).to.have.been.calledWith("--quux=true");
    });

    return afterEach(() => restore());
  });

  context("#existing process.env.CYPRESS_INTERNAL_ENV", function() {
    it("is production", () => setEnv("production"));

    it("is development", () => setEnv("development"));

    return it("is staging", () => setEnv("staging"));
  });

  context("uses package.json env", function() {
    afterEach(() => delete pkg.env);

    it("is production", () => setPkg("production"));

    it("is staging", () => setPkg("staging"));

    return it("is test", () => setPkg("test"));
  });

  return context("it uses development by default", function() {
    beforeEach(() => sinon.stub(fs, "readJsonSync").returns({}));

    return it("is development", () => expectedEnv("development"));
  });
});
