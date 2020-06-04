/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const e2e = require("../support/helpers/e2e").default;
const Fixtures = require("../support/helpers/fixtures");

describe("e2e issue 1669", function() {
  e2e.setup();

  //# https://github.com/cypress-io/cypress/issues/1669

  return it("passes", function() {
    return e2e.exec(this, {
      spec: "issue_1669_spec.js",
      snapshot: true,
      browser: 'chrome',
      expectedExitCode: 1
    });
  });
});
