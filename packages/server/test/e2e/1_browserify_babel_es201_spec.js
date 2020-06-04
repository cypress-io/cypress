/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const e2e      = require("../support/helpers/e2e").default;
const Fixtures = require("../support/helpers/fixtures");

const e2ePath = Fixtures.projectPath("e2e");

describe("e2e browserify, babel, es2015", function() {
  e2e.setup();

  it("passes", function() {
    return e2e.exec(this, {
      spec: "browserify_babel_es2015_passing_spec.coffee",
      snapshot: true,
      noTypeScript: true
    });
  });

  return it("fails", function() {
    return e2e.exec(this, {
      spec: "browserify_babel_es2015_failing_spec.js",
      snapshot: true,
      expectedExitCode: 1,
      noTypeScript: true
    });
  });
});
