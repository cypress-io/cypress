_        = require("lodash")
fs       = require("fs-extra")
path     = require("path")
Promise  = require("bluebird")
sizeOf   = require("image-size")
Fixtures = require("../support/helpers/fixtures")
e2e      = require("../support/helpers/e2e")

fs      = Promise.promisifyAll(fs)
sizeOf  = Promise.promisify(sizeOf)
e2ePath = Fixtures.projectPath("e2e")

onServer = (app) ->
  app.get "/", (req, res) ->
    res.set('Content-Type', 'text/html');

    res.send("""
    <!DOCTYPE html>
    <html lang="en">
    <body>
      <div class="black-me-out" style="position: fixed; left: 10px; top: 10px;">Redacted</div>
    </body>
    </html>
    """)

describe "e2e screenshot app capture", ->
  e2e.setup({
    servers: {
      port: 3322
      onServer: onServer
    }
  })

  it "passes", ->
    ## this tests that when an app capture screenshot is taken
    ## it waits until the runner UI is hidden to save the screenshot

    e2e.exec(@, {
      spec: "screenshot_app_capture_spec.coffee"
      expectedExitCode: 0
      snapshot: true
    })
