/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const e2e = require("../support/helpers/e2e").default;

const onServer = app => app.get("/fullPage", e2e.sendHtml(`\
<style>body { margin: 0; }</style>
<div class="black-me-out" style="position: absolute; left: 10px; top: 10px; width: 10px; height: 10px;"></div>
<div class="black-me-out" style="position: absolute; left: 30px; top: 10px; width: 10px; height: 10px;"></div>
<div style="background: white; height: 200px;"></div>
<div style="background: black; height: 200px;"></div>
<div style="background: white; height: 100px;"></div>\
`)
);

describe("e2e screenshot fullPage capture", function() {
  e2e.setup({
    servers: {
      port: 3322,
      onServer
    }
  });

  //# this tests that consistent screenshots are taken for fullPage captures,
  //# that the runner UI is hidden and that the page is scrolled properly
  return e2e.it("passes", {
    spec: "screenshot_fullpage_capture_spec.coffee",
    snapshot: true
  });
});
