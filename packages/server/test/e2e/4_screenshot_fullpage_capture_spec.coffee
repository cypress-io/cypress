e2e = require("../support/helpers/e2e")

onServer = (app) ->
  app.get "/fullPage", e2e.sendHtml("""
    <style>body { margin: 0; }</style>
    <div class="black-me-out" style="position: absolute; left: 10px; top: 10px;">Redacted</div>
    <div style="background: white; height: 200px;"></div>
    <div style="background: black; height: 200px;"></div>
    <div style="background: white; height: 100px;"></div>
  """)

describe "e2e screenshot fullPage capture", ->
  e2e.setup({
    servers: {
      port: 3322
      onServer: onServer
    }
  })

  it "passes", ->
    ## this tests that consistent screenshots are taken for fullPage captures,
    ## that the runner UI is hidden and that the page is scrolled properly

    e2e.exec(@, {
      spec: "screenshot_fullpage_capture_spec.coffee"
      expectedExitCode: 0
      snapshot: true
    })
