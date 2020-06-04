/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const e2e = require("../support/helpers/e2e").default;

describe("e2e only spec", function() {
  e2e.setup();

  return it("failing", function() {
    return e2e.exec(this, {
      spec: "only*.coffee",
      snapshot: true
    });
  });
});
