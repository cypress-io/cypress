/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const e2e = require("../support/helpers/e2e").default;

describe("e2e viewport", function() {
  e2e.setup({
    settings: {
      viewportWidth:  800,
      viewportHeight: 600
    }
  });

  return e2e.it("passes", {
    spec: "viewport_spec.coffee",
    snapshot: true
  });
});
