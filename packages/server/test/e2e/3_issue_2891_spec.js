/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const e2e = require("../support/helpers/e2e").default;
const Fixtures = require("../support/helpers/fixtures");

describe("e2e issue 2891", function() {
  e2e.setup();

  //# https://github.com/cypress-io/cypress/issues/2891

  return it("passes", function() {
    return e2e.exec(this, {
      project: Fixtures.projectPath("default-layout"),
      spec: "default_layout_spec.js",
      sanitizeScreenshotDimensions: true,
      snapshot: true
    });
  });
});
