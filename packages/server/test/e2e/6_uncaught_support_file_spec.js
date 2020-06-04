/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const e2e = require("../support/helpers/e2e").default;
const Fixtures = require("../support/helpers/fixtures");

const uncaughtSupportFile = Fixtures.projectPath("uncaught-support-file");

describe("e2e uncaught support file errors", function() {
  e2e.setup();

  return it("failing", function() {
    return e2e.exec(this, {
      project: uncaughtSupportFile,
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      expectedExitCode: 1
    });
  });
});
