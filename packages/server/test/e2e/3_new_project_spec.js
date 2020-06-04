/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const path       = require("path");
const Promise    = require("bluebird");
let fs         = require("../../lib/util/fs");
const Fixtures   = require("../support/helpers/fixtures");
const e2e        = require("../support/helpers/e2e").default;

fs = Promise.promisifyAll(fs);

const noScaffoldingPath = Fixtures.projectPath("no-scaffolding");
const supportPath       = path.join(noScaffoldingPath, "cypress", "support");

describe("e2e new project", function() {
  e2e.setup();

  return it("passes", function() {
    return fs
    .statAsync(supportPath)
    .then(function() {
      throw new Error("support folder should not exist");}).catch(() => {
      return e2e.exec(this, {
        project: noScaffoldingPath,
        sanitizeScreenshotDimensions: true,
        snapshot: true
      })
      .then(() => fs.statAsync(supportPath));
    });
  });
});
