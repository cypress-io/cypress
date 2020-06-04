/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const e2e = require("../support/helpers/e2e").default;

describe("e2e images", function() {
  e2e.setup({
    servers: {
      port: 3636,
      static: true
    }
  });

  //# this tests that images are correctly proxied and that we are not
  //# accidentally modifying their bytes in the stream

  return e2e.it("passes", {
    spec: "images_spec.coffee",
    snapshot: true
  });
});
