/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../spec_helper");

const fs = require(`${root}lib/util/fs`);

describe("lib/util/fs", function() {
  beforeEach(() => sinon.spy(console, "error"));

  it("warns when trying to use fs.existsSync", function() {
    fs.existsSync(__filename);
    const warning = "WARNING: fs sync methods can fail due to EMFILE errors";
    return expect(console.error).to.be.calledWith(warning);
  });
    // also print stack trace, maybe check that

  return context("fs.pathExists", function() {
    it("finds this file", () => fs.pathExists(__filename)
    .then(found => expect(found).to.be.true));

    return it("does not find non-existent file", () => fs.pathExists('does-not-exist')
    .then(found => expect(found).to.be.false));
  });
});
