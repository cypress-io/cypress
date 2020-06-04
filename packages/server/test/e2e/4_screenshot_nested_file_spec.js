/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const e2e = require("../support/helpers/e2e").default;

describe("e2e screenshot in nested spec", function() {
  e2e.setup();

  return e2e.it("passes", {
    spec: "nested-1/nested-2/screenshot_nested_file_spec.coffee",
    snapshot: true
  });
});
