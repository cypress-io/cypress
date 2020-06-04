/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const e2e = require("../support/helpers/e2e").default;

describe("e2e commands outside of test", function() {
  e2e.setup();

  e2e.it("fails on cy commands", {
    spec: "commands_outside_of_test_spec.coffee",
    snapshot: true,
    expectedExitCode: 1
  });

  e2e.it("fails on failing assertions", {
    spec: "assertions_failing_outside_of_test_spec.coffee",
    snapshot: true,
    expectedExitCode: 1
  });

  return e2e.it("passes on passing assertions", {
    spec: "assertions_passing_outside_of_test_spec.coffee",
    snapshot: true
  });
});
