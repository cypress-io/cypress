e2e = require("../support/helpers/e2e")

onServer = (app) ->
  app.get "/app", e2e.sendHtml("""
    <div class="black-me-out" style="position: fixed; left: 10px; top: 10px;">Redacted</div>
  """)

describe "e2e screenshot app capture", ->
  e2e.setup({
    servers: {
      port: 3322
      onServer: onServer
    }
  })

  it "passes", ->
    ## this tests that consistent screenshots are taken for app
    ## captures (namely that the runner UI is hidden)

    e2e.exec(@, {
      spec: "screenshot_app_capture_spec.coffee"
      expectedExitCode: 0
      snapshot: true
    })
