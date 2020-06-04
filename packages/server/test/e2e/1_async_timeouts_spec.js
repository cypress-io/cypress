/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const e2e = require("../support/helpers/e2e").default;

describe("e2e async timeouts", function() {
  e2e.setup();

  return e2e.it("failing1", {
    spec: "async_timeouts_spec.coffee",
    snapshot: true,
    expectedExitCode: 2
  });
});
