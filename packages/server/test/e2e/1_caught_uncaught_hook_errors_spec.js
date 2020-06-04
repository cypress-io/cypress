/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Fixtures = require("../support/helpers/fixtures");
const e2e      = require("../support/helpers/e2e").default;

const e2ePath = Fixtures.projectPath("e2e");

describe("e2e caught and uncaught hooks errors", function() {
  e2e.setup({
    servers: {
      port: 7878,
      static: true
    }
  });

  it("failing1", function() {
    return e2e.exec(this, {
      spec: "hook_caught_error_failing_spec.coffee",
      snapshot: true,
      expectedExitCode: 3
    });
  });

  it("failing2", function() {
    return e2e.exec(this, {
      spec: "hook_uncaught_error_failing_spec.coffee",
      snapshot: true,
      expectedExitCode: 1
    });
  });

  it("failing3", function() {
    return e2e.exec(this, {
      spec: "hook_uncaught_root_error_failing_spec.coffee",
      snapshot: true,
      expectedExitCode: 1
    });
  });

  return it("failing4", function() {
    return e2e.exec(this, {
      spec: "hook_uncaught_error_events_failing_spec.coffee",
      snapshot: true,
      expectedExitCode: 1
    });
  });
});
