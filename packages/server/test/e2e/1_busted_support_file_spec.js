/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Fixtures   = require("../support/helpers/fixtures");
const e2e        = require("../support/helpers/e2e").default;

const bustedSupportFile = Fixtures.projectPath("busted-support-file");

describe("e2e busted support file", function() {
  e2e.setup();

  return it("passes", function() {
    return e2e.exec(this, {
      project: bustedSupportFile,
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      expectedExitCode: 1
    });
  });
});
