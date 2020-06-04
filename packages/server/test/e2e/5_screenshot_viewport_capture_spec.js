/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const e2e = require("../support/helpers/e2e").default;

const onServer = app => app.get("/viewport", e2e.sendHtml(`\
<div class="black-me-out" style="position: fixed; left: 10px; top: 10px; width: 10px; height: 10px;"></div>
<div class="black-me-out" style="position: absolute; left: 30px; top: 10px; width: 10px; height: 10px;"></div>\
`)
);

describe("e2e screenshot viewport capture", function() {
  e2e.setup({
    servers: {
      port: 3322,
      onServer
    }
  });

  //# this tests that consistent screenshots are taken for app
  //# captures (namely that the runner UI is hidden)
  return e2e.it("passes", {
    spec: "screenshot_viewport_capture_spec.coffee",
    snapshot: true
  });
});
