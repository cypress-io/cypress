/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const e2e = require("../support/helpers/e2e").default;
const Fixtures = require("../support/helpers/fixtures");

describe("e2e task", function() {
  e2e.setup();

  return it("fails", function() {
    return e2e.exec(this, {
      project: Fixtures.projectPath("task-not-registered"),
      spec: "task_not_registered_spec.coffee",
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      expectedExitCode: 1
    });
  });
});
