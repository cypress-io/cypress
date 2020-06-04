/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../spec_helper");

describe("lib/konfig", function() {
  beforeEach(function() {
    this.env = process.env["CYPRESS_INTERNAL_ENV"];

    return this.setup = env => {
      process.env["CYPRESS_INTERNAL_ENV"] = env;

      this.konfig = require(`${root}lib/konfig`);

      return this.eq = (key, val) => {
        return expect(this.konfig(key)).to.eq(val);
      };
    };
  });

  afterEach(function() {
    process.env["CYPRESS_INTERNAL_ENV"] = this.env;

    return delete require.cache[require.resolve(`${root}lib/konfig`)];});

  it("does not set global.config", function() {
    delete global.config;
    delete require.cache[require.resolve(`${root}lib/konfig`)];

    require(`${root}lib/konfig`);
    return expect(global.config).not.to.be.ok;
  });

  it("memoizes the result", function() {
    const env = process.env["NODE_ENV"];

    process.env["NODE_ENV"] = "development";
    const config = require(`${root}lib/konfig`);

    process.env["NODE_ENV"] = "test";
    const config2 = require(`${root}lib/konfig`);

    return expect(config).to.eq(config2);
  });

  it("does not add NODE_ENV to process env if input env did not contain one", function() {
    const env = process.env["NODE_ENV"];
    delete process.env["NODE_ENV"];
    delete require.cache[require.resolve(`${root}lib/konfig`)];
    expect(process.env.hasOwnProperty('NODE_ENV')).to.eq(false);
    const config = require(`${root}lib/konfig`);
    expect(process.env.hasOwnProperty('NODE_ENV')).to.eq(false);
    return process.env["NODE_ENV"] = env;
  });

  context("development", function() {
    beforeEach(function() {
      return this.setup("development");
    });

    return it("api_url", function() {
      return this.eq("api_url", "http://localhost:1234/");
    });
  });

  context("test", function() {
    beforeEach(function() {
      return this.setup("test");
    });

    return it("api_url", function() {
      return this.eq("api_url", "http://localhost:1234/");
    });
  });

  return context("production", function() {
    beforeEach(function() {
      return this.setup("production");
    });

    return it("api_url", function() {
      return this.eq("api_url", "https://api.cypress.io/");
    });
  });
});
